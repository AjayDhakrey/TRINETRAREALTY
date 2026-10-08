import nodemailer from 'nodemailer';
import { CustomerLead } from '../../frontend/src/types/realestate';

export interface NotificationResult {
  sent: boolean;
  channel: 'email';
  recipient?: string;
  messageId?: string;
  error?: string;
}

/**
 * Send Email Notification to Business Owner immediately upon new enquiry submission.
 */
export async function sendOwnerEmailNotification(lead: CustomerLead): Promise<NotificationResult> {
  const ownerEmail =
    process.env.OWNER_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'admin@trinetrarealty.com';

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || ownerEmail;

  const formattedDate = new Date(lead.createdAt).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
  });

  const subject = `[New Lead] ${lead.type} - ${lead.name} (${lead.propertyTitle || 'General Inquiry'})`;

  const textBody = `
NEW PROPERTY ENQUIRY RECEIVED
--------------------------------------------------
Customer Name:      ${lead.name}
Phone Number:       ${lead.phone}
Customer Email:     ${lead.email}
Enquiry Type:       ${lead.type}
Property Reference: ${lead.propertyTitle || 'N/A'} (ID: ${lead.propertyId || 'N/A'})
Message:
${lead.message || 'No additional message provided.'}

Enquiry Date/Time:  ${formattedDate} (${lead.createdAt})
Lead ID:            ${lead.id}
Pipeline Status:    ${lead.status}
Lead Source:        ${lead.leadSource || 'Website Direct'}
--------------------------------------------------
Trinetra Realty CRM Automated Dispatch
`.trim();

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
      <h1>New Property Enquiry</h1>
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
        <div class="field-label">Interested Property</div>
        <div class="field-value"><strong>${escapeHtml(lead.propertyTitle || 'General Portfolio')}</strong> (ID: ${escapeHtml(lead.propertyId || 'N/A')})</div>
      </div>
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

  if (!smtpHost || !smtpUser || !smtpPass) {
    const errorMsg = 'SMTP credentials not configured (requires SMTP_HOST, SMTP_USER, SMTP_PASS in .env)';
    console.warn(`⚠️ [Email Notification] ${errorMsg}. Configured owner email: ${ownerEmail}`);
    return {
      sent: false,
      channel: 'email',
      recipient: ownerEmail,
      error: errorMsg,
    };
  }

  try {
    const isGmail = smtpHost?.includes('gmail') || smtpUser?.includes('@gmail.com');
    
    const transporter = nodemailer.createTransport(
      isGmail
        ? ({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          } as any)
        : ({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          } as any)
    );

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: ownerEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`📧 [Email Notification] Sent successfully to ${ownerEmail}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      channel: 'email',
      recipient: ownerEmail,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`❌ [Email Notification] Failed to send email to ${ownerEmail}:`, err.message);
    return {
      sent: false,
      channel: 'email',
      recipient: ownerEmail,
      error: err.message,
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
