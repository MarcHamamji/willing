import bcrypt from 'bcrypt';
import { Router } from 'express';
import * as jose from 'jose';
import zod from 'zod';

import resetPassword from '../../../auth/resetPassword.js';
import config from '../../../config.js';
import database from '../../../db/index.js';
import { sendOrganizationAcceptanceEmail, sendOrganizationRejectionEmail } from '../../../SMTP/emails.js';
import { loginInfoSchema } from '../../../types.js';
import { authorizeOnly } from '../../authorization.js';

const adminRouter = Router();

adminRouter.post('/login', async (req, res) => {
  const body = loginInfoSchema.parse(req.body);

  const account = await database
    .selectFrom('admin_account')
    .selectAll()
    .where('admin_account.email', '=', body.email)
    .executeTakeFirst();

  if (!account) {
    res.status(403);
    throw new Error('Invalid email or password');
  }

  const match = await bcrypt.compare(body.password, account.password);

  if (!match) {
    res.status(403);
    throw new Error('Invalid email or password');
  }
  const token = await new jose.SignJWT({
    id: account.id,
    role: 'admin',
  })
    .setIssuedAt()
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(config.JWT_SECRET));

  // @ts-expect-error: Do not return the password
  delete account.password;

  res.json({
    token,
    admin: account,
  });
});

adminRouter.use(authorizeOnly('admin'));

adminRouter.get('/me', async (req, res) => {
  const admin = await database
    .selectFrom('admin_account')
    .selectAll()
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirstOrThrow();

  // @ts-expect-error: Do not return the password
  delete admin.password;

  res.json({ admin });
});

adminRouter.get('/getOrganizationRequests', async (req, res) => {
  const organizationRequests = await database
    .selectFrom('organization_request')
    .selectAll()
    .execute();

  res.json({ organizationRequests });
});

adminRouter.post('/reviewOrganizationRequest', async (req, res, next) => {
  const { requestId, accepted, reason } = zod.object({
    requestId: zod.number(),
    accepted: zod.boolean(),
    reason: zod.string().nullable(),
  }).parse(req.body);

  const organizationRequest = await database
    .selectFrom('organization_request')
    .selectAll()
    .where('id', '=', requestId)
    .executeTakeFirst();

  if (!organizationRequest) {
    res.status(404);
    next(new Error('Organization request with id ' + requestId + ' not found.'));
    return;
  }

  if (!accepted) {
    sendOrganizationRejectionEmail(organizationRequest, reason);
    await database
      .deleteFrom('organization_request')
      .where('id', '=', requestId)
      .execute();
    res.json({});
    return;
  }

  const password = Math.random().toString(36).slice(-8);

  const insertedOrganization = await database.transaction().execute(async (trx) => {
    await trx
      .deleteFrom('organization_request')
      .where('id', '=', requestId)
      .execute();

    return await trx
      .insertInto('organization_account')
      .values({
        name: organizationRequest.name,
        email: organizationRequest.email,
        phone_number: organizationRequest.phone_number,
        url: organizationRequest.url,
        latitude: Number(organizationRequest.latitude),
        longitude: Number(organizationRequest.longitude),
        location_name: organizationRequest.location_name,
        password: await bcrypt.hash(password, 10),
      })
      .returningAll()
      .executeTakeFirst();
  });

  await sendOrganizationAcceptanceEmail(organizationRequest, password);

  // @ts-expect-error: Do not return the password
  delete insertedOrganization.password;

  res.json({
    organization: insertedOrganization,
  });
});

adminRouter.post('/reset-password', resetPassword);

export default adminRouter;
