import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lead } = req.body;
    if (!lead || !lead.name || !lead.email) {
      return res.status(400).json({ error: 'Invalid lead data' });
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
      subject: `[New Lead] ${lead.type} - ${lead.name} (${assetName})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #FBFBF9;">
          <div style="max-width: 600px; margin: auto; background: #fff; border: 1px solid #E7E5E4; padding: 24px;">
            <h2 style="color: #1E3A2F; margin-top: 0;">New Client Lead: ${lead.type}</h2>
            <p><strong>Customer Name:</strong> ${lead.name}</p>
            <p><strong>Phone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></p>
            <p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>
            <p><strong>Asset:</strong> ${assetName} (ID: ${lead.propertyId || lead.projectId || 'N/A'})</p>
            ${isVisit ? `<p><strong>Scheduled Visit:</strong> ${lead.preferredDate || 'Flexible'} (${lead.preferredTimeSlot || 'Standard'}) - ${lead.visitMode || 'In-Person'}</p>` : ''}
            <p><strong>Message:</strong> ${lead.message || 'No additional message.'}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Lead ID:</strong> ${lead.id}</p>
          </div>
        </div>
      `,
    });

    // 2. Send Client Confirmation Email to Customer (lead.email)
    const clientMail = transporter.sendMail({
      from: '"Trinetra Realty" <dhakreyajay444@gmail.com>',
      to: lead.email,
      subject: `${isVisit ? 'Schedule Visit Confirmed' : 'Inquiry Received'}: ${assetName} [Ref: ${lead.id}]`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #FBFBF9;">
          <div style="max-width: 600px; margin: auto; background: #fff; border: 1px solid #E7E5E4; padding: 28px;">
            <h1 style="color: #141413; font-family: Georgia, serif; margin-top: 0;">Trinetra Realty</h1>
            <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.08em; color: #1E3A2F; font-weight: bold;">
              Private Client Advisory Desk · Confirmation Dossier
            </p>
            <hr style="border: none; border-top: 1px solid #E7E5E4; margin: 16px 0;" />
            <h3 style="color: #141413;">Dear ${lead.name},</h3>
            <p style="color: #44403C; line-height: 1.6;">
              Thank you for choosing Trinetra Realty. Your inquiry for <strong>${assetName}</strong> has been registered under reference dossier ID: <strong>${lead.id}</strong>.
            </p>
            ${
              isVisit
                ? `
              <div style="background: #F3F2EE; padding: 16px; border: 1px solid #E7E5E4; margin: 16px 0;">
                <div style="font-size: 11px; font-weight: bold; color: #1E3A2F; text-transform: uppercase;">Scheduled Viewing</div>
                <div><strong>Date:</strong> ${lead.preferredDate || 'Flexible'}</div>
                <div><strong>Time Slot:</strong> ${lead.preferredTimeSlot || 'Standard Viewing Hours'}</div>
                <div><strong>Mode:</strong> ${lead.visitMode || 'In-Person Private Tour'}</div>
              </div>`
                : ''
            }
            <p style="color: #44403C; line-height: 1.6;">
              A Senior Managing Partner has been assigned to your file and will contact you directly at ${lead.phone}.
            </p>
            <p style="color: #78716C; font-size: 12px; margin-top: 24px;">
              Direct Executive Desk: dhakreyajay444@gmail.com · Trinetra Realty
            </p>
          </div>
        </div>
      `,
    });

    const [ownerResult, clientResult] = await Promise.allSettled([ownerMail, clientMail]);

    return res.status(200).json({
      success: true,
      ownerSent: ownerResult.status === 'fulfilled',
      clientSent: clientResult.status === 'fulfilled',
    });
  } catch (err) {
    console.error('Vercel mailer error:', err);
    return res.status(500).json({ error: err.message });
  }
}
