// import nodemailer from 'nodemailer';
// import 'dotenv/config';

// async function main() {
//   const {
//     SMTP_HOST,
//     SMTP_PORT,
//     SMTP_SECURE,
//     SMTP_USER,
//     SMTP_PASS,
//     MAIL_FROM,
//   } = process.env;

//   if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
//     throw new Error('Missing SMTP env vars in server/.env');
//   }

//   const transporter = nodemailer.createTransport({
//     host: SMTP_HOST,
//     port: Number(SMTP_PORT),
//     secure: SMTP_SECURE === 'true',
//     auth: { user: SMTP_USER, pass: SMTP_PASS },
//   });

//   await transporter.sendMail({
//     from: MAIL_FROM,
//     to: SMTP_USER, // sends to the same inbox
//     subject: 'SMTP test (Willing)',
//     text: 'If you got this, your server can send email via Gmail SMTP.',
//   });

//   console.log('Sent. Check inbox:', SMTP_USER);
// }

// main().catch((err) => {
//   console.error('SMTP test failed:', err); 
//   process.exit(1);
// });
