import { Router } from 'express';
import database from '../../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import config from '../../config.js';
import { authorizeOnly } from '../authorization.js';

const volunteerRouter = Router();

const createVolunteerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(str => !isNaN(Date.parse(str)), { message: 'Invalid date format' }),
  gender: z.enum(['male', 'female', 'other'], 'Gender should be \'female\', \'male\', or \'other\' '),
});

volunteerRouter.post('/create', async (req, res) => {
  const body = createVolunteerSchema.parse(req.body);

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

  const token = jwt.sign(
    { id: newVolunteer.id, role: 'volunteer' },
    config.JWT_SECRET,
  );

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
