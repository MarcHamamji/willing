import zod from 'zod';

import {
  EnrollmentSchema,
  EnrollmentApplicationSchema,
  VolunteerSkillSchema,
  volunteerAccountWithoutPasswordSchema,
  type OrganizationPosting,
  type PostingSkill,
} from './db/tables.js';

export type Role = 'admin' | 'volunteer' | 'organization';

export interface UserJWT {
  id: number;
  role: Role;
}

export const loginInfoSchema = zod.object({
  email: zod.email(),
  password: zod.string(),
});

export type LoginInfo = zod.infer<typeof loginInfoSchema>;

export interface GeocodingResponseEntry {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export type GeocodingResponse = GeocodingResponseEntry[];

export type PostingResponse = {
  posting: OrganizationPosting;
  skills: PostingSkill[];
};

export type VolunteerPostingResponse = PostingResponse & {
  isEnrolled: boolean;
};

const _enrolledVolunteerSchema = volunteerAccountWithoutPasswordSchema
  .omit({
    id: true,
    description: true,
    privacy: true,
  })
  .extend({
    enrollment_id: zod.number(),
    volunteer_id: EnrollmentSchema.shape.volunteer_id,
    message: EnrollmentSchema.shape.message,
    skills: zod.array(VolunteerSkillSchema),
  });

export type EnrolledVolunteer = zod.infer<typeof _enrolledVolunteerSchema>;

export type EnrollmentsResponse = {
  enrollments: EnrolledVolunteer[];
};

const _pendingApplicationSchema = volunteerAccountWithoutPasswordSchema
  .omit({
    id: true,
    description: true,
    privacy: true,
  })
  .extend({
    application_id: zod.number(),
    volunteer_id: EnrollmentApplicationSchema.shape.volunteer_id,
    message: EnrollmentApplicationSchema.shape.message,
    created_at: EnrollmentApplicationSchema.shape.created_at,
    skills: zod.array(VolunteerSkillSchema),
  });

export type PendingApplication = zod.infer<typeof _pendingApplicationSchema>;

export type ApplicationsResponse = {
  applications: PendingApplication[];
};
