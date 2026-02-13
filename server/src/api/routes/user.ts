import { Router } from 'express';
import database from '../../db/index.js';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import zod from 'zod';
import config from '../../config.js';
import { LoginInfoSchema } from '../../types.js';

const userRouter = Router();

userRouter.post('/login', async (req, res) => {
  const body = LoginInfoSchema.parse(req.body);

  let organizationAccount;
  let volunteerAccount;

  // eslint-disable-next-line prefer-const
  organizationAccount = await database
    .selectFrom('organization_account')
    .selectAll()
    .where('organization_account.email', '=', body.email)
    .executeTakeFirst();

  if (!organizationAccount) {
    volunteerAccount = await database
      .selectFrom('volunteer_account')
      .selectAll()
      .where('volunteer_account.email', '=', body.email)
      .executeTakeFirst();
  }

  if ((!organizationAccount) && (!volunteerAccount)) {
    res.status(403);
    throw new Error('Invalid login');
  }

  let valid;
  if (organizationAccount)
    valid = await bcrypt.compare(body.password, organizationAccount.password);

  if (volunteerAccount)
    valid = await bcrypt.compare(body.password, volunteerAccount.password);

  if (!valid) {
    res.status(403);
    throw new Error('Invalid login');
  }

  const token = await new jose.SignJWT({
    id: (organizationAccount || volunteerAccount)?.id,
    role: organizationAccount ? 'organization' : 'volunteer',
  }).setIssuedAt()
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(config.JWT_SECRET));

  res.json({
    token,
    role: organizationAccount ? 'organization' : 'volunteer',
  });
});

export default userRouter;
