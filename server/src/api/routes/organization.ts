import { Router } from 'express';
import database from '../../db/index.js';
import { sendAdminOrganizationRequestEmail } from '../../SMTP/emails.js';
import { newOrganizationRequestSchema, OrganizationPostingSchema } from '../../db/tables.js';
import { authorizeOnly, setUserJWT } from '../authorization.js';

const organizationRouter = Router();

organizationRouter.post('/request', async (req, res) => {
  const body = newOrganizationRequestSchema.parse(req.body);

  const email = body.email.toLowerCase().trim();

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

organizationRouter.use(authorizeOnly('organization'));

organizationRouter.post('/posting', async (req, res) => {
  const body = OrganizationPostingSchema.omit({ id: true, organization_id: true }).parse(req.body);
  const orgId = req.userJWT!.id;

  const posting = await database
    .insertInto('organization_posting')
    .values({
      organization_id: orgId,
      title: body.title,
      description: body.description,
      latitude: body.latitude ?? undefined,
      longitude: body.longitude ?? undefined,
      max_volunteers: body.max_volunteers ?? undefined,
      start_timestamp: body.start_timestamp,
      end_timestamp: body.end_timestamp ?? undefined,
      minimum_age: body.minimum_age ?? undefined,
      is_open: body.is_open ?? true,
    }) 
    .returningAll().executeTakeFirst();

  if (!posting) {
    return res.status(500).json({ error: 'Failed to create posting' });
  }

  res.status(201).json(posting);
});

organizationRouter.get('/posting', async (req, res) => {
  const orgId = req.userJWT!.id;

  const posting = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('organization_id', '=', orgId)
    .orderBy('start_timestamp', 'asc')
    .execute();

  res.json({ posting });
});

organizationRouter.get('/me', async (req, res) => {
  const organization = await database
    .selectFrom('organization_account')
    .selectAll()
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirstOrThrow();

  // @ts-expect-error: do not return the password
  delete organization.password;
  res.json({ organization });
});

export default organizationRouter;
