import { Router } from 'express';

import volunteerCvRouter from './cv.js';
import { VolunteerProfileResponse } from './index.types.js';
import volunteerPostingRouter from './posting.js';
import resetPassword from '../../../auth/resetPassword.js';
import database from '../../../db/index.js';

const volunteerRouter = Router();

const getVolunteerProfile = async (volunteerId: number): Promise<VolunteerProfileResponse> => {
  const volunteer = await database
    .selectFrom('volunteer_account')
    .select([
      'id',
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

  const volunteerSkills = await database
    .selectFrom('volunteer_skill')
    .select('name')
    .where('volunteer_id', '=', volunteerId)
    .orderBy('id', 'asc')
    .execute();

  return {
    volunteer: {
      id: volunteer.id,
      first_name: volunteer.first_name,
      last_name: volunteer.last_name,
      email: volunteer.email,
      date_of_birth: volunteer.date_of_birth,
      gender: volunteer.gender,
      privacy: volunteer.privacy,
      cv_path: volunteer.cv_path,
      description: volunteer.description ?? '',
    },
    skills: volunteerSkills.map(skill => skill.name),
  };
};

volunteerRouter.post('/reset-password', resetPassword);

volunteerRouter.use('/posting', volunteerPostingRouter);
volunteerRouter.use('/cv', volunteerCvRouter);

export default volunteerRouter;
