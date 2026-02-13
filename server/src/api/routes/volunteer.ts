import { Router } from 'express';
import database from '../../db/index.js';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { z } from 'zod';
import config from '../../config.js';
import { authorizeOnly } from '../authorization.js';
import { volunteerAccountSchema } from '../../db/tables.js';

const volunteerRouter = Router();

volunteerRouter.post('/create', async (req, res) => {
  const body = volunteerAccountSchema.parse(req.body);

  const existingVolunteer = await database
    .selectFrom('volunteer_account')
    .select('id')
    .where('email', '=', body.email)
    .executeTakeFirst();

  if (existingVolunteer) {
    res.status(409);
    throw new Error('Account already exists, log in or use another email');
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const newVolunteer = await database
    .insertInto('volunteer_account')
    .values({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      password: hashedPassword,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
    })
    .returningAll()
    .executeTakeFirst();

  if (!newVolunteer) {
    res.status(500);
    throw new Error('Failed to create volunteer');
  }

  const token = await new jose.SignJWT({ id: newVolunteer.id, role: 'volunteer' })
    .setIssuedAt()
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(config.JWT_SECRET));

  // @ts-expect-error: do not return the password
  delete newVolunteer.password;
  res.status(201).json({ volunteer: newVolunteer, token });
});

volunteerRouter.use(authorizeOnly('volunteer'));

volunteerRouter.get('/me', async (req, res) => {
  const volunteer = await database
    .selectFrom('volunteer_account')
    .selectAll()
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirstOrThrow();

  // @ts-expect-error: do not return the password
  delete volunteer.password;
  res.json({ volunteer });
});

export default volunteerRouter;
