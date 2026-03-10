import { Router, Response } from 'express';
import zod from 'zod';

import { OrganizationMeResponse, OrganizationProfileResponse, OrganizationRequestResponse } from './index.types.js';
import postingRouter from './posting.js';
import resetPassword from '../../../auth/resetPassword.js';
import database from '../../../db/index.js';
import { newOrganizationRequestSchema, organizationAccountSchema, PostingSkill } from '../../../db/tables.js';
import { recomputeOrganizationVector } from '../../../services/embeddings/embeddingUpdateService.js';
import { sendAdminOrganizationRequestEmail } from '../../../SMTP/emails.js';
import { authorizeOnly } from '../../authorization.js';

const organizationRouter = Router();
const organizationProfileUpdateSchema = organizationAccountSchema.omit({
  id: true,
  password: true,
  email: true,
  org_vector: true,
  created_at: true,
  updated_at: true,
}).partial();

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

organizationRouter.get('/:id', async (req, res: Response<OrganizationProfileResponse>, next) => {
  let orgId;
  try {
    orgId = zod.object({
      id: zod.string().regex(/^\d+$/, 'Organization ID must be a number').transform(Number),
    }).parse(req.params).id;
  } catch (_error: unknown) {
    next();
    return;
  }

  const organization = await database
    .selectFrom('organization_account')
    .select([
      'id',
      'name',
      'email',
      'phone_number',
      'url',
      'latitude',
      'longitude',
      'location_name',
      'created_at',
      'updated_at',
    ])
    .where('id', '=', orgId)
    .executeTakeFirst();

  if (!organization) {
    res.status(404);
    throw new Error('Organization not found');
  }

  // Fetch organization's postings
  const postings = await database
    .selectFrom('organization_posting')
    .selectAll()
    .where('organization_id', '=', orgId)
    .orderBy('start_timestamp', 'asc')
    .execute();

  // Fetch skills for all postings
  const postingIds = postings.map(p => p.id);
  const skills = postingIds.length > 0
    ? await database
        .selectFrom('posting_skill')
        .selectAll()
        .where('posting_id', 'in', postingIds)
        .execute()
    : [];

  const skillsByPostingId = new Map<number, PostingSkill[]>();
  skills.forEach((skill) => {
    if (!skillsByPostingId.has(skill.posting_id)) {
      skillsByPostingId.set(skill.posting_id, []);
    }
    skillsByPostingId.get(skill.posting_id)!.push(skill);
  });

  const postingsWithSkills = postings.map(posting => ({
    ...posting,
    skills: skillsByPostingId.get(posting.id) || [],
  }));

  res.json({ organization, postings: postingsWithSkills });
});

// Protected organization routes
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
