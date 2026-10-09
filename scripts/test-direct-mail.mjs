import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dhakreyajay444@gmail.com',
    pass: 'uootivqjiomdjmgy',
  },
});

async function main() {
  console.log('Sending to dhakreyajay444@gmail.com...');
  const res1 = await transporter.sendMail({
    from: '"Trinetra Realty" <dhakreyajay444@gmail.com>',
    to: 'dhakreyajay444@gmail.com',
    subject: 'Direct Test: Trinetra Realty Notification',
    html: '<h2>Owner Notification Test</h2><p>Delivered directly to Primary Inbox via Google Gmail!</p>',
  });
  console.log('✅ Sent to owner:', res1.messageId);

  console.log('Sending to dhakreyajay1356@gmail.com...');
  const res2 = await transporter.sendMail({
    from: '"Trinetra Realty" <dhakreyajay444@gmail.com>',
    to: 'dhakreyajay1356@gmail.com',
    subject: 'Direct Test: Trinetra Realty Client Confirmation',
    html: '<h2>Client Confirmation Test</h2><p>Delivered directly to Primary Inbox via Google Gmail!</p>',
  });
  console.log('✅ Sent to client:', res2.messageId);
}

main().catch(console.error);

