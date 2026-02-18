import bcrypt from 'bcrypt';
import { Router } from 'express';
import * as jose from 'jose';

import config from '../../config.js';
import database from '../../db/index.js';
import { loginInfoSchema } from '../../types.js';

const userRouter = Router();

userRouter.post('/login', async (req, res) => {
  const body = loginInfoSchema.parse(req.body);

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
    throw new Error('Invalid email or password');
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

export default userRouter;
