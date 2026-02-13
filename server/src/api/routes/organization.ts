import { Router } from 'express';
import database from '../../db/index.js';
import { sendAdminOrganizationRequestEmail } from './admin/emails.js';
import { newOrganizationRequestSchema } from '../../db/tables.js';

const orgRouter = Router();

orgRouter.post('/request', async (req, res) => {
  const body = newOrganizationRequestSchema.parse(req.body);

  const organization = await database
    .insertInto('organization_request')
    .values({
      name: body.name,
      email: body.email,
      phone_number: body.phone_number,
      url: body.url,
      location_name: body.location_name,

      // FORCE 0,0 for now
      latitude: 0,
      longitude: 0,
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
