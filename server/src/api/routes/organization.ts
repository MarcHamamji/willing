import { Router } from 'express';
import zod from 'zod';
import database from '../../db/index.js';
import { sendAdminOrganizationRequestEmail } from './admin/emails.js';

const orgRouter = Router();

const orgRequestSchema = zod.object({
  name: zod.string().min(1),
  email: zod.email(),
  phone_number: zod.string().optional().default(''),
  url: zod.string().optional().default(''),
  location_name: zod.string().min(1),
  latitude: zod.number().optional(),
  longitude: zod.number().optional(),
});

orgRouter.post('/request', async (req, res) => {
  const body = orgRequestSchema.parse(req.body);

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
