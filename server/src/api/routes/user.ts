import crypto from 'crypto';

import bcrypt from 'bcrypt';
import { Router, Response } from 'express';
import * as jose from 'jose';
import zod from 'zod';

import {
  UserForgotPasswordResetResponse,
  UserForgotPasswordResponse,
  UserLoginResponse,
} from './user.types.js';
import config from '../../config.js';
import database from '../../db/index.js';
import { passwordSchema } from '../../db/tables.js';
import { sendPasswordResetEmail } from '../../SMTP/emails.js';
import { loginInfoSchema } from '../../types.js';

const userRouter = Router();
const organizationLoginColumns = [
  'id',
  'name',
  'email',
  'phone_number',
  'url',
  'latitude',
  'longitude',
  'location_name',
  'password',
] as const;

const volunteerLoginColumns = [
  'id',
  'first_name',
  'last_name',
  'email',
  'password',
  'date_of_birth',
  'gender',
  'cv_path',
  'description',
  'privacy',
] as const;

const forgotPasswordRequestSchema = zod.object({
  email: zod.email(),
});

const forgotPasswordResetSchema = zod.object({
  key: zod.string().min(1),
  password: passwordSchema,
});

userRouter.post('/login', async (req, res: Response<UserLoginResponse>) => {
  const body = loginInfoSchema.parse(req.body);

  let organizationAccount;
  let volunteerAccount;

  // eslint-disable-next-line prefer-const
  organizationAccount = await database
    .selectFrom('organization_account')
    .select(organizationLoginColumns)
    .where('organization_account.email', '=', body.email)
    .executeTakeFirst();

  if (!organizationAccount) {
    volunteerAccount = await database
      .selectFrom('volunteer_account')
      .select(volunteerLoginColumns)
      .where('volunteer_account.email', '=', body.email)
      .executeTakeFirst();
  }

  if ((!organizationAccount) && (!volunteerAccount)) {
    res.status(403);
    throw new Error('Invalid email or password');
  }

  let valid;
  if (organizationAccount)
    valid = await bcrypt.compare(body.password, organizationAccount.password);

  if (volunteerAccount)
    valid = await bcrypt.compare(body.password, volunteerAccount.password);

  if (!valid) {
    res.status(403);
    throw new Error('Invalid email or password');
  }

  const token = await new jose.SignJWT({
    id: (organizationAccount || volunteerAccount)?.id,
    role: organizationAccount ? 'organization' : 'volunteer',
  }).setIssuedAt()
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(config.JWT_SECRET));

  // @ts-expect-error: Do not return the password
  delete organizationAccount?.password;
  // @ts-expect-error: Do not return the password
  delete volunteerAccount?.password;

  res.json({
    token,
    role: organizationAccount ? 'organization' : 'volunteer',
    [organizationAccount ? 'organization' : 'volunteer']: organizationAccount || volunteerAccount,
  });
});

userRouter.post('/forgot-password', async (req, res: Response<UserForgotPasswordResponse>) => {
  const body = forgotPasswordRequestSchema.parse(req.body);

  const organizationAccount = await database
    .selectFrom('organization_account')
    .select(['id', 'name', 'email'])
    .where('organization_account.email', '=', body.email)
    .executeTakeFirst();

  let role: 'organization' | 'volunteer' | null = null;
  let volunteerAccount;

  if (organizationAccount) {
    role = 'organization';
  } else {
    volunteerAccount = await database
      .selectFrom('volunteer_account')
      .select(['id', 'first_name', 'last_name', 'email'])
      .where('volunteer_account.email', '=', body.email)
      .executeTakeFirst();

    if (volunteerAccount) {
      role = 'volunteer';
    }
  }

  res.json({});

  if (!organizationAccount && !volunteerAccount) {
    return;
  }

  const account = organizationAccount || volunteerAccount;
  const accountName = organizationAccount ? organizationAccount.name : `${volunteerAccount!.first_name} ${volunteerAccount!.last_name}`;
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

  await database
    .insertInto('password_reset_token')
    .values({
      user_id: account!.id,
      role: role!,
      token: resetToken,
      expires_at: expiresAt,
      created_at: new Date(),
    })
    .execute();

  await sendPasswordResetEmail(body.email, accountName, resetToken);

  res.json({});
});

userRouter.post('/forgot-password/reset', async (req, res: Response<UserForgotPasswordResetResponse>) => {
  const body = forgotPasswordResetSchema.parse(req.body);

  const resetToken = await database
    .selectFrom('password_reset_token')
    .selectAll()
    .where('password_reset_token.token', '=', body.key)
    .executeTakeFirst();

  if (!resetToken) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  if (new Date() > resetToken.expires_at) {
    res.status(400);
    throw new Error('Reset token has expired');
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  if (resetToken.role === 'organization') {
    await database
      .updateTable('organization_account')
      .where('id', '=', resetToken.user_id)
      .set({ password: hashedPassword })
      .execute();
  } else if (resetToken.role === 'volunteer') {
    await database
      .updateTable('volunteer_account')
      .where('id', '=', resetToken.user_id)
      .set({ password: hashedPassword })
      .execute();
  }

  await database
    .deleteFrom('password_reset_token')
    .where('password_reset_token.id', '=', resetToken.id)
    .execute();

  res.json({});
});

export default userRouter;
