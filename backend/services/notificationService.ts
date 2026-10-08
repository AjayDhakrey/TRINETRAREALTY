import nodemailer from 'nodemailer';
import { CustomerLead } from '../../frontend/src/types/realestate';

export interface NotificationResult {
  sent: boolean;
  channel: 'email' | 'whatsapp';
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
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpFrom = process.env.SMTP_FROM || `"Trinetra Realty CRM" <${smtpUser || ownerEmail}>`;

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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; margin: 0; padding: 24px; color: #141413; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e7e5e4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #141413; color: #ffffff; padding: 20px 24px; }
    .header h2 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #a8a29e; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #1E3A2F; color: #ffffff; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 2px; text-transform: uppercase; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { text-align: left; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f5f5f4; }
    th { color: #78716c; font-weight: 500; width: 38%; }
    td { color: #141413; font-weight: 600; }
    .message-box { background: #fbfbf9; border: 1px solid #e7e5e4; padding: 14px; border-radius: 4px; font-size: 13px; line-height: 1.5; color: #292524; margin-top: 12px; }
    .footer { background: #fbfbf9; border-top: 1px solid #e7e5e4; padding: 14px 24px; text-align: center; font-size: 11px; color: #78716c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>Trinetra Realty — New Customer Enquiry</h2>
      <p>Direct lead dispatched from public platform</p>
    </div>
    <div class="content">
      <div class="badge">${lead.type}</div>
      <table>
        <tr>
          <th>Customer Name</th>
          <td>${lead.name}</td>
        </tr>
        <tr>
          <th>Mobile / Phone</th>
          <td><a href="tel:${lead.phone}" style="color: #1E3A2F; text-decoration: none;">${lead.phone}</a></td>
        </tr>
        <tr>
          <th>Customer Email</th>
          <td><a href="mailto:${lead.email}" style="color: #1E3A2F; text-decoration: none;">${lead.email}</a></td>
        </tr>
        <tr>
          <th>Property Title</th>
          <td>${lead.propertyTitle || 'General Portfolio'}</td>
        </tr>
        <tr>
          <th>Property Reference ID</th>
          <td><code>${lead.propertyId || 'N/A'}</code></td>
        </tr>
        <tr>
          <th>Enquiry Timestamp</th>
          <td>${formattedDate}</td>
        </tr>
        <tr>
          <th>Lead Tracking ID</th>
          <td><code>${lead.id}</code></td>
        </tr>
      </table>

      <div style="font-size: 12px; font-weight: 600; color: #78716c; text-transform: uppercase;">Customer Message</div>
      <div class="message-box">
        "${lead.message || 'No additional message provided.'}"
      </div>
    </div>
    <div class="footer">
      This is an automated advisory notification from Trinetra Realty Real Estate Platform.
    </div>
  </div>
</body>
</html>
`.trim();

  // If SMTP credentials are not configured, log clear advisory and return clean result
  if (!smtpHost || !smtpUser || !smtpPass) {
    const error = 'SMTP credentials not configured (requires SMTP_HOST, SMTP_USER, SMTP_PASS in .env)';
    console.warn(`⚠️ [Email Notification] ${error}. Configured owner email: ${ownerEmail}`);
    return {
      sent: false,
      channel: 'email',
      recipient: ownerEmail,
      error,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

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

/**
 * Send WhatsApp Notification to Business Owner immediately upon new enquiry submission.
 * Supports Twilio WhatsApp API or Meta WhatsApp Cloud API via standard HTTP requests.
 */
export async function sendOwnerWhatsAppNotification(lead: CustomerLead): Promise<NotificationResult> {
  const ownerWhatsApp = process.env.OWNER_WHATSAPP_NUMBER;

  const formattedDate = new Date(lead.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
  });

  const whatsappMessageText = `🏠 *NEW PROPERTY ENQUIRY RECEIVED*

👤 *Customer Name:* ${lead.name}
📱 *Phone Number:* ${lead.phone}
📧 *Email:* ${lead.email}
🏛️ *Property:* ${lead.propertyTitle || 'General Portfolio'} (Ref: ${lead.propertyId || 'N/A'})
💬 *Message:* "${lead.message || 'No message provided'}"
📅 *Date & Time:* ${formattedDate}
🆔 *Lead ID:* ${lead.id}

_Trinetra Realty CRM Auto-Dispatch_`;

  if (!ownerWhatsApp) {
    const error = 'OWNER_WHATSAPP_NUMBER not configured in environment variables.';
    console.warn(`⚠️ [WhatsApp Notification] ${error}`);
    return {
      sent: false,
      channel: 'whatsapp',
      error,
    };
  }

  // --- Option 1: Twilio WhatsApp Messaging API ---
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // default Twilio sandbox

  if (twilioSid && twilioToken) {
    try {
      const recipientNumber = ownerWhatsApp.startsWith('whatsapp:')
        ? ownerWhatsApp
        : `whatsapp:${ownerWhatsApp.replace(/\s+/g, '')}`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const bodyParams = new URLSearchParams({
        From: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
        To: recipientNumber,
        Body: whatsappMessageText,
      });

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Twilio error status ${response.status}`);
      }

      console.log(`📱 [WhatsApp Notification] Sent successfully via Twilio to ${recipientNumber}. SID: ${data.sid}`);
      return {
        sent: true,
        channel: 'whatsapp',
        recipient: recipientNumber,
        messageId: data.sid,
      };
    } catch (err: any) {
      console.error(`❌ [WhatsApp Notification] Twilio API dispatch failed:`, err.message);
      return {
        sent: false,
        channel: 'whatsapp',
        recipient: ownerWhatsApp,
        error: err.message,
      };
    }
  }

  // --- Option 2: Meta WhatsApp Cloud API (Graph API) ---
  const metaToken = process.env.WHATSAPP_API_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId) {
    try {
      const cleanTo = ownerWhatsApp.replace(/[^0-9]/g, '');
      const metaUrl = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;

      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: {
            preview_url: false,
            body: whatsappMessageText,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `Meta WhatsApp error status ${response.status}`);
      }

      const msgId = data?.messages?.[0]?.id;
      console.log(`📱 [WhatsApp Notification] Sent successfully via Meta Cloud API to ${cleanTo}. ID: ${msgId}`);
      return {
        sent: true,
        channel: 'whatsapp',
        recipient: cleanTo,
        messageId: msgId,
      };
    } catch (err: any) {
      console.error(`❌ [WhatsApp Notification] Meta Cloud API dispatch failed:`, err.message);
      return {
        sent: false,
        channel: 'whatsapp',
        recipient: ownerWhatsApp,
        error: err.message,
      };
    }
  }

  // If neither provider has API keys configured
  const error = 'No WhatsApp API credentials configured (requires TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN or WHATSAPP_API_TOKEN/WHATSAPP_PHONE_NUMBER_ID in .env)';
  console.warn(`⚠️ [WhatsApp Notification] ${error}. Target number: ${ownerWhatsApp}`);
  return {
    sent: false,
    channel: 'whatsapp',
    recipient: ownerWhatsApp,
    error,
  };
}

