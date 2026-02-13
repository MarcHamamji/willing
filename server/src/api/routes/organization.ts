import { Router } from 'express';
import database from '../../db/index.js';
import { sendAdminOrganizationRequestEmail } from './admin/emails.js';
import { newOrganizationRequestSchema } from '../../db/tables.js';

const orgRouter = Router();

orgRouter.post('/request', async (req, res) => {
  const body = newOrganizationRequestSchema.parse(req.body);

  const email = body.email.toLowerCase().trim();

  // check email in existing account
  const checkAccountRequest = await database
    .selectFrom('organization_account')
    .select('id')
    .where('email', '=', email)
    .executeTakeFirst();

  if (checkAccountRequest) {
    return res.status(400).json({
      success: false,
      message: 'An organization with this email account already exists',
    });
  }

  // check email in pending requests
  const checkPendingRequest = await database
    .selectFrom('organization_request')
    .select('id')
    .where('email', '=', email)
    .executeTakeFirst();

  if (checkPendingRequest) {
    return res.status(400).json({
      success: false,
      message: 'A request with this email is already pending',
    });
  }

  const organization = await database
    .insertInto('organization_request')
    .values({
      name: body.name,
      email: email,
      phone_number: body.phone_number,
      url: body.url,
      location_name: body.location_name,
      latitude: body.latitude,
      longitude: body.longitude,
    })
    .returningAll().executeTakeFirst();

  if (!organization) {
    throw new Error('Failed to create organization request');
  } else {
    try {
      sendAdminOrganizationRequestEmail(organization);
    } catch (error) {
      console.error('Failed to send organization request email to admin', error);
    }
    res.status(201).json({ success: true });
  }
});

export default orgRouter;
