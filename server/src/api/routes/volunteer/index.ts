import bcrypt from 'bcrypt';
import { Router, Response } from 'express';
import * as jose from 'jose';
import zod from 'zod';

import volunteerCvRouter from './cv.js';
import { VolunteerCreateResponse, VolunteerMeResponse, VolunteerProfileResponse } from './index.types.js';
import volunteerPostingRouter from './posting.js';
import resetPassword from '../../../auth/resetPassword.js';
import config from '../../../config.js';
import database from '../../../db/index.js';
import { type VolunteerAccountWithoutPassword, newVolunteerAccountSchema, volunteerAccountSchema } from '../../../db/tables.js';
import {
  recomputeVolunteerExperienceVector,
  recomputeVolunteerProfileVector,
} from '../../../services/embeddings/embeddingUpdateService.js';
import { getVolunteerProfile } from '../../../services/volunteer/index.js';
import { authorizeOnly } from '../../authorization.js';

const volunteerRouter = Router();
const volunteerProfileUserUpdateSchema = volunteerAccountSchema.omit({
  id: true,
  password: true,
  email: true,
  profile_vector: true,
  experience_vector: true,
  created_at: true,
  updated_at: true,
}).partial();

const volunteerProfileUpdateSchema = volunteerProfileUserUpdateSchema.extend({
  skills: zod.array(zod.string().trim().min(1, 'Skill cannot be empty')).optional(),
});

const normalizeSkillList = (skills: string[]) =>
  Array.from(new Set(skills.map(skill => skill.trim()).filter(Boolean))).sort();

const areSkillListsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  return left.every((skill, index) => skill === right[index]);
};

volunteerRouter.post('/create', async (req, res: Response<VolunteerCreateResponse>) => {
  const body = newVolunteerAccountSchema.parse(req.body);

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
      privacy: 'public',
    })
    .returningAll()
    .executeTakeFirst();

  if (!newVolunteer) {
    res.status(500);
    throw new Error('Failed to create volunteer');
  }

  await recomputeVolunteerProfileVector(newVolunteer.id);
  await recomputeVolunteerExperienceVector(newVolunteer.id);

  const token = await new jose.SignJWT({ id: newVolunteer.id, role: 'volunteer' })
    .setIssuedAt()
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(config.JWT_SECRET));

  // @ts-expect-error: do not return the password
  delete newVolunteer.password;

  res.json({ volunteer: newVolunteer, token });
});

volunteerRouter.use(authorizeOnly('volunteer'));

volunteerRouter.get('/me', async (req, res: Response<VolunteerMeResponse>) => {
  const volunteer = await database
    .selectFrom('volunteer_account')
    .selectAll()
    .where('id', '=', req.userJWT!.id)
    .executeTakeFirstOrThrow();

  // @ts-expect-error: do not return the password
  delete volunteer.password;

  res.json({ volunteer });
});

volunteerRouter.get('/profile', async (req, res: Response<VolunteerProfileResponse>) => {
  const profile = await getVolunteerProfile(req.userJWT!.id);
  res.json(profile);
});

volunteerRouter.put('/profile', async (req, res: Response<VolunteerProfileResponse>) => {
  const body = volunteerProfileUpdateSchema.parse(req.body);
  const volunteerId = req.userJWT!.id;

  const existingVolunteer = await database
    .selectFrom('volunteer_account')
    .select([
      'first_name',
      'last_name',
      'email',
      'date_of_birth',
      'gender',
      'cv_path',
      'description',
      'privacy',
    ])
    .where('id', '=', volunteerId)
    .executeTakeFirstOrThrow();

  const existingSkills = await database
    .selectFrom('volunteer_skill')
    .select('name')
    .where('volunteer_id', '=', volunteerId)
    .execute();

  const normalizedExistingSkills = normalizeSkillList(existingSkills.map(skill => skill.name));
  const normalizedIncomingSkills = body.skills !== undefined ? normalizeSkillList(body.skills) : undefined;

  const didSkillsChange = normalizedIncomingSkills !== undefined
    ? !areSkillListsEqual(normalizedIncomingSkills, normalizedExistingSkills)
    : false;

  const shouldRecomputeProfileVector = (
    (body.first_name !== undefined && body.first_name !== existingVolunteer.first_name)
    || (body.last_name !== undefined && body.last_name !== existingVolunteer.last_name)
    || (body.gender !== undefined && body.gender !== existingVolunteer.gender)
    || (body.cv_path !== undefined && body.cv_path !== existingVolunteer.cv_path)
    || (body.description !== undefined && body.description !== existingVolunteer.description)
    || didSkillsChange
  );

  await database.transaction().execute(async (trx) => {
    const volunteerUpdate: Partial<Omit<VolunteerAccountWithoutPassword, 'id'>> = {};

    if (body.first_name !== undefined) volunteerUpdate.first_name = body.first_name;
    if (body.last_name !== undefined) volunteerUpdate.last_name = body.last_name;
    if (body.date_of_birth !== undefined) volunteerUpdate.date_of_birth = body.date_of_birth;
    if (body.gender !== undefined) volunteerUpdate.gender = body.gender;
    if (body.cv_path !== undefined) volunteerUpdate.cv_path = body.cv_path;
    if (body.description !== undefined) volunteerUpdate.description = body.description;
    if (body.privacy !== undefined) volunteerUpdate.privacy = body.privacy;

    if (Object.keys(volunteerUpdate).length > 0) {
      await trx
        .updateTable('volunteer_account')
        .set(volunteerUpdate)
        .where('id', '=', volunteerId)
        .execute();
    }

    if (didSkillsChange) {
      await trx
        .deleteFrom('volunteer_skill')
        .where('volunteer_id', '=', volunteerId)
        .execute();

      if (normalizedIncomingSkills && normalizedIncomingSkills.length > 0) {
        await trx
          .insertInto('volunteer_skill')
          .values(
            normalizedIncomingSkills.map(name => ({
              volunteer_id: volunteerId,
              name,
            })),
          )
          .execute();
      }
    }
  });

  if (shouldRecomputeProfileVector) {
    await recomputeVolunteerProfileVector(volunteerId);
  }

  const profile = await getVolunteerProfile(volunteerId);
  res.json(profile);
});

volunteerRouter.post('/reset-password', resetPassword);

volunteerRouter.use('/profile/cv', volunteerCvRouter);
volunteerRouter.use('/posting', volunteerPostingRouter);

export default volunteerRouter;
