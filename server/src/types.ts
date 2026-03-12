import zod from 'zod';

import {
  type OrganizationPostingWithoutVectors,
  type PostingSkill,
  VolunteerSkill,
  VolunteerAccountWithoutPassword,
} from './db/tables.js';

export type Role = 'admin' | 'volunteer' | 'organization';

export const genderSchema = zod.enum(['male', 'female', 'other'], 'Gender should be \'female\', \'male\', or \'other\' ');
export type Gender = zod.infer<typeof genderSchema>;

export type SuccessResponse = Record<string, never>;

export interface UserJWT {
  id: number;
  role: Role;
}

export const loginInfoSchema = zod.object({
  email: zod.email(),
  password: zod.string(),
});

export type LoginInfo = zod.infer<typeof loginInfoSchema>;

export type PostingWithSkills = OrganizationPostingWithoutVectors & {
  skills: PostingSkill[];
};

export type PostingWithSkillsAndOrgName = PostingWithSkills & {
  organization_name: string;
};

export type PostingEnrollment = {
  enrollment_id: number;
  volunteer_id: number;
  message: string | undefined;
  attended: boolean;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: Gender;
  skills: VolunteerSkill[];
};

export type PostingApplication = Omit<
  VolunteerAccountWithoutPassword,
    'id' | 'description' | 'privacy'
> & {
  skills: VolunteerSkill[];
  volunteer_id: number;
  message: string | undefined;
  created_at: Date;
  application_id: number;
};
