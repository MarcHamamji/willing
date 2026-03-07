import { Router, Response } from 'express';
import zod from 'zod';

import { OrganizationMeResponse, OrganizationRequestResponse } from './index.types.js';
import postingRouter from './posting.js';
import resetPassword from '../../../auth/resetPassword.js';
import database from '../../../db/index.js';
import { newOrganizationRequestSchema, organizationAccountSchema } from '../../../db/tables.js';
import { recomputeOrganizationVector } from '../../../services/embeddingUpdateService.js';
import { sendAdminOrganizationRequestEmail } from '../../../SMTP/emails.js';
import { authorizeOnly } from '../../authorization.js';

const organizationRouter = Router();
const organizationProfileUpdateSchema = organizationAccountSchema.omit({
  id: true,
  password: true,
  org_vector: true,
  created_at: true,
  updated_at: true,
}).partial().extend({
  email: zod.email('Invalid email').transform(val => val.toLowerCase().trim()).optional(),
});

const isSameNullableNumber = (left: number | undefined, right: number | undefined) => (left ?? null) === (right ?? null);

organizationRouter.post('/request', async (req, res: Response<OrganizationRequestResponse>) => {
  const body = newOrganizationRequestSchema.parse(req.body);

  const email = body.email;

  const checkAccountRequest = await database
    .selectFrom('organization_account')
    .select('id')
    .where('email', '=', email)
    .executeTakeFirst();

  if (checkAccountRequest) {
    res.status(400);
    throw new Error('An organization with this email account already exists');
  }

  const checkPendingRequest = await database
    .selectFrom('organization_request')
    .select('id')
    .where('email', '=', email)
    .executeTakeFirst();

  if (checkPendingRequest) {
    res.status(400);
    throw new Error('A request with this email is already pending');
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
    await sendAdminOrganizationRequestEmail(organization);
    res.json({});
  }
});

organizationRouter.use(authorizeOnly('organization'));

organizationRouter.get('/me', async (req, res: Response<OrganizationMeResponse>) => {
  const organization = await database
    .selectFrom('organization_account')
    .selectAll()
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirstOrThrow();

  // @ts-expect-error: do not return the password
  delete organization.password;

  res.json({ organization });
});

organizationRouter.put('/profile', async (req, res) => {
  const body = organizationProfileUpdateSchema.parse(req.body);
  const organizationId = req.userJWT!.id;
  const existingOrganization = await database
    .selectFrom('organization_account')
    .select([
      'name',
      'url',
      'location_name',
      'latitude',
      'longitude',
    ])
    .where('id', '=', organizationId)
    .executeTakeFirstOrThrow();

  if (body.email !== undefined) {
    const duplicateOrganization = await database
      .selectFrom('organization_account')
      .select('id')
      .where('email', '=', body.email)
      .where('id', '!=', organizationId)
      .executeTakeFirst();

    if (duplicateOrganization) {
      res.status(409);
      throw new Error('Another organization already uses this email');
    }
  }

  const shouldRecomputeOrganizationVector = (
    (body.name !== undefined && body.name !== existingOrganization.name)
    || (body.url !== undefined && body.url !== existingOrganization.url)
    || (body.location_name !== undefined && body.location_name !== existingOrganization.location_name)
    || (body.latitude !== undefined && !isSameNullableNumber(body.latitude, existingOrganization.latitude))
    || (body.longitude !== undefined && !isSameNullableNumber(body.longitude, existingOrganization.longitude))
  );

  if (Object.keys(body).length > 0) {
    await database
      .updateTable('organization_account')
      .set(body)
      .where('id', '=', organizationId)
      .execute();
  }

  if (shouldRecomputeOrganizationVector) {
    await recomputeOrganizationVector(organizationId);
  }

  const organization = await database
    .selectFrom('organization_account')
    .selectAll()
    .where('id', '=', organizationId)
    .executeTakeFirstOrThrow();

  // @ts-expect-error: do not return the password
  delete organization.password;

  res.json({ organization });
});

organizationRouter.post('/reset-password', resetPassword);

organizationRouter.use('/posting', postingRouter);

export default organizationRouter;
