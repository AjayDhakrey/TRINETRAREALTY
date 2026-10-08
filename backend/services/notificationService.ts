import nodemailer from 'nodemailer';
import dns from 'node:dns';
import { CustomerLead } from '../../frontend/src/types/realestate';

export interface NotificationResult {
  sent: boolean;
  channel: 'email';
  recipient?: string;
  messageId?: string;
  error?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates a nodemailer transporter strictly configured for IPv4 to prevent
 * ENETUNREACH errors in cloud container environments (like Render).
 */
function createSmtpTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const isGmail = smtpHost.includes('gmail') || Boolean(smtpUser?.includes('@gmail.com'));
  const host = isGmail ? 'smtp.gmail.com' : smtpHost;
  const port = isGmail ? 587 : smtpPort;
  const secure = isGmail ? false : (String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    family: 4,
    lookup: (hostname: string, _options: any, callback: any) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  } as any);
}

/**
 * Send Email Notification to Business Owner immediately upon new enquiry submission.
 */
export async function sendOwnerEmailNotification(lead: CustomerLead): Promise<NotificationResult> {
  const ownerEmail =
    process.env.OWNER_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'admin@trinetrarealty.com';

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || ownerEmail;

  const formattedDate = new Date(lead.createdAt).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
  });

  const subject = `[New Lead] ${lead.type} - ${lead.name} (${lead.propertyTitle || lead.projectName || 'General Inquiry'})`;

  const visitDetailsText =
    lead.type === 'Schedule Visit'
      ? `Preferred Date:    ${lead.preferredDate || 'Flexible'}\nTime Slot:         ${lead.preferredTimeSlot || 'Standard Business Hours'}\nVisit Mode:        ${lead.visitMode || 'In-Person Private Tour'}\n`
      : '';

  const textBody = `
NEW PROPERTY ENQUIRY RECEIVED
--------------------------------------------------
Customer Name:      ${lead.name}
Phone Number:       ${lead.phone}
Customer Email:     ${lead.email}
Enquiry Type:       ${lead.type}
Property Reference: ${lead.propertyTitle || lead.projectName || 'General Portfolio'} (ID: ${lead.propertyId || lead.projectId || 'N/A'})
${visitDetailsText}Message:
${lead.message || 'No additional message provided.'}

Enquiry Date/Time:  ${formattedDate} (${lead.createdAt})
Lead ID:            ${lead.id}
Pipeline Status:    ${lead.status}
Lead Source:        ${lead.leadSource || 'Website Direct'}
--------------------------------------------------
Trinetra Realty CRM Automated Dispatch
`.trim();

  const visitDetailsHtml =
    lead.type === 'Schedule Visit'
      ? `
      <div class="field-row">
        <div class="field-label">Preferred Date</div>
        <div class="field-value">${escapeHtml(lead.preferredDate || 'Flexible')}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Time Slot</div>
        <div class="field-value">${escapeHtml(lead.preferredTimeSlot || 'Standard Business Hours')}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Visit Mode</div>
        <div class="field-value">${escapeHtml(lead.visitMode || 'In-Person Private Tour')}</div>
      </div>
      `
      : '';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBF9; color: #141413; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E7E5E4; border-radius: 4px; overflow: hidden; }
    .header { background: #1E3A2F; color: #FBFBF9; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #D6CFC2; }
    .content { padding: 32px; }
    .field-row { display: flex; margin-bottom: 14px; border-bottom: 1px solid #F5F5F4; padding-bottom: 10px; }
    .field-label { width: 160px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #78716C; }
    .field-value { flex: 1; font-size: 14px; color: #1C1917; font-weight: 500; }
    .message-box { background: #F9F9F8; border-left: 3px solid #1E3A2F; padding: 16px; margin: 20px 0; font-style: italic; color: #292524; font-size: 14px; }
    .footer { background: #F5F5F4; padding: 18px 32px; font-size: 11px; color: #A8A29E; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>New Lead: ${escapeHtml(lead.type)}</h1>
      <p>Trinetra Realty Client Acquisition Protocol</p>
    </div>
    <div class="content">
      <div class="field-row">
        <div class="field-label">Customer Name</div>
        <div class="field-value">${escapeHtml(lead.name)}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Phone Number</div>
        <div class="field-value"><a href="tel:${escapeHtml(lead.phone)}" style="color: #1E3A2F; text-decoration: none;">${escapeHtml(lead.phone)}</a></div>
      </div>
      <div class="field-row">
        <div class="field-label">Email Address</div>
        <div class="field-value"><a href="mailto:${escapeHtml(lead.email)}" style="color: #1E3A2F; text-decoration: none;">${escapeHtml(lead.email)}</a></div>
      </div>
      <div class="field-row">
        <div class="field-label">Enquiry Type</div>
        <div class="field-value">${escapeHtml(lead.type)}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Interested Asset</div>
        <div class="field-value"><strong>${escapeHtml(lead.propertyTitle || lead.projectName || 'General Portfolio')}</strong> (ID: ${escapeHtml(lead.propertyId || lead.projectId || 'N/A')})</div>
      </div>
      ${visitDetailsHtml}
      <div class="field-row">
        <div class="field-label">Submission Date</div>
        <div class="field-value">${escapeHtml(formattedDate)}</div>
      </div>
      <div class="field-row">
        <div class="field-label">Lead Source</div>
        <div class="field-value">${escapeHtml(lead.leadSource || 'Website Direct')}</div>
      </div>

      <div style="margin-top: 24px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #78716C;">Customer Message:</div>
      <div class="message-box">
        "${escapeHtml(lead.message || 'No additional note provided by the client.')}"
      </div>
    </div>
    <div class="footer">
      Trinetra Realty CRM Auto-Notification · Pipeline ID: ${escapeHtml(lead.id)}
    </div>
  </div>
</body>
</html>
`.trim();

  if (!smtpUser || !smtpPass) {
    const errorMsg = 'SMTP credentials not configured (requires SMTP_USER and SMTP_PASS in .env)';
    console.warn(`⚠️ [Email Notification] ${errorMsg}. Configured owner email: ${ownerEmail}`);
    return {
      sent: false,
      channel: 'email',
      recipient: ownerEmail,
      error: errorMsg,
    };
  }

  try {
    const transporter = createSmtpTransporter();
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: ownerEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`📧 [Email Notification] Sent successfully to owner ${ownerEmail}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      channel: 'email',
      recipient: ownerEmail,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`❌ [Email Notification] Failed to send email to owner ${ownerEmail}:`, err.message);
    return {
      sent: false,
      channel: 'email',
      recipient: ownerEmail,
      error: err.message,
    };
  }
}

/**
 * Send Client Confirmation Email immediately to the customer acknowledging their inquiry / schedule visit.
 */
export async function sendClientConfirmationEmail(lead: CustomerLead): Promise<NotificationResult> {
  const customerEmail = lead.email?.trim();
  if (!customerEmail || !customerEmail.includes('@')) {
    return {
      sent: false,
      channel: 'email',
      recipient: customerEmail,
      error: 'Invalid customer email address',
    };
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'admin@trinetrarealty.com';

  const assetName = lead.propertyTitle || lead.projectName || 'Trinetra Realty Portfolio';
  const isVisit = lead.type === 'Schedule Visit';

  const subject = isVisit
    ? `Schedule Visit Confirmed: ${assetName} [Ref: ${lead.id}]`
    : `Private Advisory Confirmation: ${assetName} [Ref: ${lead.id}]`;

  const visitDetailsText = isVisit
    ? `Scheduled Date:    ${lead.preferredDate || 'Flexible'}\nTime Slot:         ${lead.preferredTimeSlot || 'Standard Business Hours'}\nVisit Mode:        ${lead.visitMode || 'In-Person Private Tour'}\n`
    : '';

  const textBody = `
Dear ${lead.name},

Thank you for contacting Trinetra Realty Private Advisory Desk.

Your request has been registered under reference dossier ID: ${lead.id}.
A Senior Advisory Partner has been assigned to your file and will contact you directly.

REQUEST SUMMARY:
--------------------------------------------------
Asset:             ${assetName}
Request Type:      ${lead.type}
${visitDetailsText}Submitted Email:   ${lead.email}
Submitted Phone:   ${lead.phone}
--------------------------------------------------

Warm regards,
Trinetra Realty · Private Client Advisory
Executive Concierge: admin@trinetrarealty.com
`.trim();

  const visitDetailsHtml = isVisit
    ? `
      <div style="background-color: #F3F2EE; border: 1px solid #E7E5E4; padding: 16px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #1E3A2F; margin-bottom: 8px;">Scheduled Viewing Details</div>
        <div style="font-size: 14px; color: #141413; line-height: 1.6;">
          <div><strong>Date:</strong> ${escapeHtml(lead.preferredDate || 'Flexible')}</div>
          <div><strong>Time Slot:</strong> ${escapeHtml(lead.preferredTimeSlot || 'Standard Business Hours')}</div>
          <div><strong>Mode:</strong> ${escapeHtml(lead.visitMode || 'In-Person Private Tour')}</div>
        </div>
      </div>
      `
    : '';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBF9; color: #141413; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E7E5E4; border-radius: 4px; overflow: hidden; }
    .header { background: #141413; color: #FBFBF9; padding: 32px 32px; border-bottom: 2px solid #1E3A2F; }
    .header h1 { margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: 500; letter-spacing: 0.02em; }
    .header p { margin: 6px 0 0; font-size: 12px; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.08em; }
    .content { padding: 32px; line-height: 1.6; }
    .status-badge { display: inline-block; background-color: #1E3A2F; color: #ffffff; padding: 4px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    .footer { background: #F5F5F4; padding: 20px 32px; font-size: 11px; color: #78716C; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Trinetra Realty</h1>
      <p>Private Client Advisory Desk · Client Dossier Confirmation</p>
    </div>
    <div class="content">
      <div class="status-badge">Confirmed · ${escapeHtml(lead.type)}</div>
      <h2 style="font-family: Georgia, serif; font-size: 20px; margin: 0 0 12px; color: #141413;">Dear ${escapeHtml(lead.name)},</h2>
      <p style="font-size: 14px; color: #44403C; margin: 0 0 16px;">
        Thank you for your interest in <strong>${escapeHtml(assetName)}</strong>. Your request has been recorded under official reference dossier ID: <strong style="font-family: monospace; color: #1E3A2F;">${escapeHtml(lead.id)}</strong>.
      </p>
      <p style="font-size: 14px; color: #44403C; margin: 0 0 16px;">
        A Senior Managing Partner has been assigned to your inquiry and will reach out to you directly at <a href="tel:${escapeHtml(lead.phone)}" style="color: #1E3A2F; text-decoration: none;">${escapeHtml(lead.phone)}</a> or via email.
      </p>

      ${visitDetailsHtml}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E7E5E4; font-size: 12px; color: #78716C;">
        <div><strong>Direct Advisory Desk:</strong> admin@trinetrarealty.com</div>
        <div><strong>Operating Headquarters:</strong> Trinetra Realty Executive Suites, NCR · New York</div>
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Trinetra Realty Private Limited. Confidential Client Advisory Communication.
    </div>
  </div>
</body>
</html>
`.trim();

  if (!smtpUser || !smtpPass) {
    return {
      sent: false,
      channel: 'email',
      recipient: customerEmail,
      error: 'SMTP credentials not configured',
    };
  }

  try {
    const transporter = createSmtpTransporter();
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: customerEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`📧 [Email Notification] Sent confirmation successfully to customer ${customerEmail}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      channel: 'email',
      recipient: customerEmail,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`❌ [Email Notification] Failed to send confirmation to customer ${customerEmail}:`, err.message);
    return {
      sent: false,
      channel: 'email',
      recipient: customerEmail,
      error: err.message,
    };
  }
}
