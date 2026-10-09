import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Trinetra Email Relay',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // use raw body
      }
    }

    const lead = body?.lead || body;
    if (!lead || !lead.name || !lead.email) {
      return res.status(400).json({ error: 'Invalid lead data. Name and email are required.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dhakreyajay444@gmail.com',
        pass: 'uootivqjiomdjmgy',
      },
    });

    const formattedDate = new Date(lead.createdAt || Date.now()).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'Asia/Kolkata',
    });

    const assetName = lead.propertyTitle || lead.projectName || 'Trinetra Realty Portfolio';
    const isVisit = lead.type === 'Schedule Visit';

    // 1. Send Internal Lead Dossier to Business Owner (dhakreyajay444@gmail.com)
    const ownerMail = transporter.sendMail({
      from: '"Trinetra Realty CRM" <dhakreyajay444@gmail.com>',
      to: 'dhakreyajay444@gmail.com',
      subject: `[New Lead] ${lead.type || 'Inquiry'} - ${lead.name} (${assetName})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBF9; color: #141413; margin: 0; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E7E5E4; border-radius: 4px; overflow: hidden;">
            <div style="background: #1E3A2F; color: #FBFBF9; padding: 24px 28px;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 600;">New Lead: ${lead.type || 'Inquiry'}</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #D6CFC2;">Trinetra Realty Client Acquisition Protocol</p>
            </div>
            <div style="padding: 24px 28px;">
              <p><strong>Customer Name:</strong> ${lead.name}</p>
              <p><strong>Phone:</strong> <a href="tel:${lead.phone}" style="color: #1E3A2F;">${lead.phone}</a></p>
              <p><strong>Email:</strong> <a href="mailto:${lead.email}" style="color: #1E3A2F;">${lead.email}</a></p>
              <p><strong>Interested Asset:</strong> <strong>${assetName}</strong> (ID: ${lead.propertyId || lead.projectId || 'N/A'})</p>
              ${isVisit ? `<p><strong>Scheduled Viewing:</strong> ${lead.preferredDate || 'Flexible'} (${lead.preferredTimeSlot || 'Standard'}) - ${lead.visitMode || 'In-Person'}</p>` : ''}
              <p><strong>Submission Date:</strong> ${formattedDate}</p>
              <p><strong>Lead Source:</strong> ${lead.leadSource || 'Website Direct'}</p>
              <div style="margin-top: 16px; padding: 14px; background: #F9F9F8; border-left: 3px solid #1E3A2F; font-style: italic;">
                "${lead.message || 'No additional note provided by the client.'}"
              </div>
            </div>
            <div style="background: #F5F5F4; padding: 14px 28px; font-size: 11px; color: #78716C; text-align: center;">
              Trinetra Realty CRM Auto-Notification · Pipeline ID: ${lead.id || 'N/A'}
            </div>
          </div>
        </div>
      `,
    });

    // 2. Send Client Confirmation Email to Customer (lead.email)
    const clientMail = transporter.sendMail({
      from: '"Trinetra Realty" <dhakreyajay444@gmail.com>',
      to: lead.email,
      subject: `${isVisit ? 'Schedule Visit Confirmed' : 'Private Advisory Confirmation'}: ${assetName} [Ref: ${lead.id || 'TR-LEAD'}]`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FBFBF9; color: #141413; margin: 0; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E7E5E4; border-radius: 4px; overflow: hidden;">
            <div style="background: #141413; color: #FBFBF9; padding: 28px 28px; border-bottom: 2px solid #1E3A2F;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 22px; font-weight: 500;">Trinetra Realty</h1>
              <p style="margin: 6px 0 0; font-size: 11px; color: #A8A29E; text-transform: uppercase; letter-spacing: 0.08em;">
                Private Client Advisory Desk · Client Dossier Confirmation
              </p>
            </div>
            <div style="padding: 28px 28px; line-height: 1.6;">
              <h2 style="font-family: Georgia, serif; font-size: 18px; margin: 0 0 12px; color: #141413;">Dear ${lead.name},</h2>
              <p style="font-size: 14px; color: #44403C; margin: 0 0 16px;">
                Thank you for your interest in <strong>${assetName}</strong>. Your inquiry has been registered under reference dossier ID: <strong style="font-family: monospace; color: #1E3A2F;">${lead.id || 'TR-LEAD'}</strong>.
              </p>
              ${
                isVisit
                  ? `
                <div style="background-color: #F3F2EE; border: 1px solid #E7E5E4; padding: 14px; margin: 16px 0;">
                  <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #1E3A2F; margin-bottom: 6px;">Scheduled Viewing Details</div>
                  <div style="font-size: 13px; color: #141413;">
                    <div><strong>Date:</strong> ${lead.preferredDate || 'Flexible'}</div>
                    <div><strong>Time Slot:</strong> ${lead.preferredTimeSlot || 'Standard Business Hours'}</div>
                    <div><strong>Mode:</strong> ${lead.visitMode || 'In-Person Private Tour'}</div>
                  </div>
                </div>`
                  : ''
              }
              <p style="font-size: 14px; color: #44403C; margin: 0 0 16px;">
                A Senior Advisory Partner has been assigned to your file and will contact you directly at <a href="tel:${lead.phone}" style="color: #1E3A2F; text-decoration: none;">${lead.phone}</a> or via email.
              </p>
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E7E5E4; font-size: 12px; color: #78716C;">
                <div><strong>Direct Advisory Desk:</strong> dhakreyajay444@gmail.com</div>
                <div><strong>Operating Headquarters:</strong> Trinetra Realty Executive Suites, NCR · New York</div>
              </div>
            </div>
            <div style="background: #F5F5F4; padding: 16px 28px; font-size: 11px; color: #78716C; text-align: center;">
              © ${new Date().getFullYear()} Trinetra Realty Private Limited. Confidential Client Advisory Communication.
            </div>
          </div>
        </div>
      `,
    });

    const [ownerResult, clientResult] = await Promise.allSettled([ownerMail, clientMail]);

    // Forward lead to Render backend for live WhatsApp dispatch & MongoDB CRM logging
    try {
      fetch('https://trinetra-realty-backend.onrender.com/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      }).catch(() => {});
    } catch {}

    return res.status(200).json({
      success: true,
      ownerSent: ownerResult.status === 'fulfilled',
      clientSent: clientResult.status === 'fulfilled',
      ownerDetails: ownerResult.status === 'fulfilled' ? ownerResult.value.messageId : ownerResult.reason?.message,
      clientDetails: clientResult.status === 'fulfilled' ? clientResult.value.messageId : clientResult.reason?.message,
    });
  } catch (err) {
    console.error('Vercel mailer error:', err);
    return res.status(500).json({ error: err.message });
  }
}

