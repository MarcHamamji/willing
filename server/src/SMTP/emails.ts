import config from '../config.js';
import { sendEmail } from './mailer.js';
import db from '../db/index.js';
import { OrganizationRequest } from '../db/tables.js';

export async function sendOrganizationAcceptanceEmail(
  organizationRequest: OrganizationRequest,
  password: string,
) {
  const to = organizationRequest.email;

  const subject = 'Your organization request was accepted';

  const text
    = `Hello ${organizationRequest.name},\n\n`
      + `Your organization request has been accepted.\n\n`
      + `Credentials:\n`
      + `    Email: ${to}\n`
      + `    Temporary password: ${password}\n\n`
      + `Login: ${config.CLIENT_URL}/login\n\n`
      + `Please change your password after logging in.\n\n`
      + `Willing Team`;

  await sendEmail({ to, subject, text });
}

export async function sendPasswordResetEmail(to: string, name: string, resetToken: string) {
  const subject = 'Reset your Willing password';
  const resetUrl = `${config.CLIENT_URL}/forgot-password?key=${encodeURIComponent(resetToken)}`;

  const text
    = `Hello ${name},\n\n`
      + 'We received a request to reset your password.\n\n'
      + `Reset link: ${resetUrl}\n\n`
      + 'If you did not request a password reset, you can ignore this email.\n\n'
      + 'Willing Team';

  await sendEmail({ to, subject, text });
}

export async function sendOrganizationRejectionEmail(
  organizationRequest: OrganizationRequest,
  reason: string | null,
) {
  const to = organizationRequest.email;

  const subject = 'Your organization request was rejected';

  const reasonBlock
    = reason && reason.trim().length
      ? `Reason: ${reason.trim()}\n\n`
      : '';

  const text
    = `Hello ${organizationRequest.name},\n\n`
      + `Your organization request has been rejected.\n\n`
      + reasonBlock
      + `If you believe this was a mistake, you can submit a new request with updated information.\n`
      + 'For any extra questions, please contact us at willing.app.lb@gmail.com.\n\n'
      + `Willing Team`;

  await sendEmail({ to, subject, text });
}

export async function sendAdminOrganizationRequestEmail(
  organizationRequest: OrganizationRequest,
) {
  const subject = 'New organization request submitted!';

  const text
    = `A new organization request has been submitted.\n\n`
      + `Organization name: ${organizationRequest.name}\n`
      + `Organization email: ${organizationRequest.email}\n`
      + `Phone: ${organizationRequest.phone_number ?? '—'}\n`
      + `Website: ${organizationRequest.url ?? '—'}\n`
      + `Location: ${organizationRequest.location_name}\n\n`
      + `Review it in the admin dashboard: ${config.CLIENT_URL + '/admin'}`;
  const emails = (await db.selectFrom('admin_account').select(['email']).execute()).map(row => row.email);
  await sendEmail({
    to: emails.join(', '),
    subject,
    text,
  });
}
export async function sendVolunteerApplicationAcceptedEmail(opts: {
  volunteerEmail: string;
  volunteerName: string;
  organizationName: string;
  postingTitle: string;
}) {
  const subject = 'Your volunteering application was accepted';

  const text
    = `Hello ${opts.volunteerName},\n\n`
      + 'Good news. Your application for the volunteering position below was accepted.\n\n'
      + `Organization: ${opts.organizationName}\n`
      + `Position: ${opts.postingTitle}\n\n`
      + `Willing Team`;

  await sendEmail({ to: opts.volunteerEmail, subject, text });
}

export async function sendVolunteerApplicationRejectedEmail(opts: {
  volunteerEmail: string;
  volunteerName: string;
  organizationName: string;
  postingTitle: string;
}) {
  const subject = 'Your volunteering application was not accepted';

  const text
    = `Hello ${opts.volunteerName},\n\n`
      + 'Your application for the volunteering position below was not accepted.\n\n'
      + `Organization: ${opts.organizationName}\n`
      + `Position: ${opts.postingTitle}\n\n`
      + `Willing Team`;

  await sendEmail({ to: opts.volunteerEmail, subject, text });
}
