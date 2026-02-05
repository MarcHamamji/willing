// import nodemailer from 'nodemailer';

// const {
//   SMTP_HOST,
//   SMTP_PORT,
//   SMTP_SECURE,
//   SMTP_USER,
//   SMTP_PASS,
//   MAIL_FROM,
// } = process.env;

// if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
//   throw new Error('Missing SMTP env vars in server/.env');
// }

// const transporter = nodemailer.createTransport({
//   host: SMTP_HOST,
//   port: Number(SMTP_PORT),
//   secure: SMTP_SECURE === 'true',
//   auth: { user: SMTP_USER, pass: SMTP_PASS },
// });

// export async function sendEmail(opts: {
//   to: string;
//   subject: string;
//   text: string;
//   html?: string;
// }) {
//   return transporter.sendMail({
//     from: MAIL_FROM,
//     to: opts.to,
//     subject: opts.subject,
//     text: opts.text,
//     html: opts.html,
//   });
// }
