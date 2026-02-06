import { Router } from 'express';
import zod from 'zod';
import database from '../../db/index.js';

const orgRouter = Router();

const orgRequestSchema = zod.object({
  name: zod.string().min(1),
  email: zod.string().email(),
  phone_number: zod.string().optional().default(''),
  url: zod.string().optional().default(''),
  location_name: zod.string().min(1),
  latitude: zod.number().optional(),
  longitude: zod.number().optional(),
});

orgRouter.post('/request', async (req, res) => {
  const body = orgRequestSchema.parse(req.body);

  await database
    .insertInto('organization_request')
    .values({
      name: body.name,
      email: body.email,
      phone_number: body.phone_number,
      url: body.url,
      location_name: body.location_name,

      // FORCE 0,0 for now
      latitude: '0',
      longitude: '0',
    })
    .execute();

  res.status(201).json({ success: true });
});

export default orgRouter;
