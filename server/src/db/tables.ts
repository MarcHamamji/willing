import zod from 'zod';

import { genderSchema } from '../types.js';

import type { Generated } from 'kysely';

type WithGeneratedID<T> = Omit<T, 'id'> & {
  id: Generated<number>;
};

type WithGeneratedIDAndCreatedAt<T> = Omit<T, 'id' | 'created_at'> & {
  id: Generated<number>;
  created_at: Generated<Date>;
};

type WithGeneratedIDAndTimestamps<T> = Omit<T, 'id' | 'created_at' | 'updated_at'> & {
  id: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
};

const organizationWebsiteSchema = zod.url('URL is invalid')
  .trim()
  .refine(url => /^https?:\/\//i.test(url), {
    message: 'URL must start with http:// or https://',
  })
  .refine((url) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.includes('.') && !hostname.endsWith('.');
    } catch {
      return false;
    }
  }, {
    message: 'URL is invalid',
  });

export const passwordSchema = zod
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// volunteer_account

export const volunteerAccountSchema = zod.object({
  id: zod.number(),
  first_name: zod.string().min(1, 'First name is required'),
  last_name: zod.string().min(1, 'Last name is required'),
  email: zod.email('Invalid email').transform(val => val.toLowerCase().trim()),
  password: passwordSchema,
  date_of_birth: zod
    .string()
    .min(1, 'Date of birth is required')
    .refine(str => !isNaN(Date.parse(str)), { message: 'Invalid date format' }),
  gender: genderSchema,
  cv_path: zod.string().trim().max(256, 'CV path must be at most 256 characters').optional(),
  description: zod.string().max(500, 'Description must be less than 500 characters').optional(),
  privacy: zod.enum(['public', 'private']),
  profile_vector: zod.string().optional(),
  experience_vector: zod.string().optional(),
  updated_at: zod.date(),
  created_at: zod.date(),
});
export type VolunteerAccount = zod.infer<typeof volunteerAccountSchema>;

export type VolunteerAccountTable = WithGeneratedIDAndTimestamps<VolunteerAccount>;

export const newVolunteerAccountSchema = volunteerAccountSchema.omit({
  id: true,
  privacy: true,
  cv_path: true,
  description: true,
  profile_vector: true,
  experience_vector: true,
  created_at: true,
  updated_at: true,
});
export type NewVolunteerAccount = zod.infer<typeof newVolunteerAccountSchema>;

export const volunteerAccountWithoutPasswordSchema = volunteerAccountSchema.omit({
  password: true,
  profile_vector: true,
  experience_vector: true,
  created_at: true,
  updated_at: true,
});
export type VolunteerAccountWithoutPassword = zod.infer<typeof volunteerAccountWithoutPasswordSchema>;

// organization_request

export const organizationRequestSchema = zod.object({
  id: zod.number(),
  name: zod.string().min(1, 'Name is required'),
  email: zod.email('Invalid email').transform(val => val.toLowerCase().trim()),
  phone_number: zod.e164('Phone number is invalid'),
  url: organizationWebsiteSchema,
  latitude: zod
    .number()
    .min(-90, { message: 'Latitude must be >= -90' })
    .max(90, { message: 'Latitude must be <= 90' })
    .optional(),
  longitude: zod
    .number()
    .min(-180, { message: 'Longitude must be >= -180' })
    .max(180, { message: 'Longitude must be <= 180' })
    .optional(),
  location_name: zod.string().min(2, 'Location must be longer than 2 characters'),
  created_at: zod.date(),
});

export type OrganizationRequest = zod.infer<typeof organizationRequestSchema>;

export type OrganizationRequestTable = WithGeneratedIDAndCreatedAt<OrganizationRequest>;

export const newOrganizationRequestSchema = organizationRequestSchema.omit({ id: true, created_at: true });
export type NewOrganizationRequest = zod.infer<typeof newOrganizationRequestSchema>;

// organization_account

export const organizationAccountSchema = zod.object({
  id: zod.number(),
  name: zod.string().min(1, 'Name is required'),
  email: zod.email('Invalid email').transform(val => val.toLowerCase().trim()),
  phone_number: zod.e164('Phone number is invalid'),
  url: organizationWebsiteSchema,
  latitude: zod
    .number()
    .min(-90, { message: 'Latitude must be >= -90' })
    .max(90, { message: 'Latitude must be <= 90' })
    .optional(),
  longitude: zod
    .number()
    .min(-180, { message: 'Longitude must be >= -180' })
    .max(180, { message: 'Longitude must be <= 180' })
    .optional(),
  location_name: zod.string().min(2, 'Location must be longer than 2 characters'),
  password: passwordSchema,
  org_vector: zod.string().optional(),
  updated_at: zod.date(),
  created_at: zod.date(),
});

export type OrganizationAccount = zod.infer<typeof organizationAccountSchema>;

export type OrganizationAccountTable = WithGeneratedIDAndTimestamps<OrganizationAccount>;

export const newOrganizationAccountSchema = organizationAccountSchema.omit({ id: true, org_vector: true, created_at: true, updated_at: true });
export type NewOrganizationAccount = zod.infer<typeof newOrganizationAccountSchema>;

export const organizationAccountUpdate = organizationAccountSchema.omit({ password: true, org_vector: true, created_at: true, updated_at: true });
export type OrganizationAccountWithoutPassword = zod.infer<typeof organizationAccountUpdate>;

export const organizationAccountWithoutPasswordAndVectorSchema = organizationAccountSchema.omit({
  password: true,
  org_vector: true,
});
export type OrganizationAccountWithoutPasswordAndVector = zod.infer<typeof organizationAccountWithoutPasswordAndVectorSchema>;

// admin_account

export const adminAccountSchema = zod.object({
  id: zod.number(),
  first_name: zod.string().min(1, 'first name should have at least 1 character'),
  last_name: zod.string().min(1, 'last name should have at least 1 character'),
  email: zod.email('Invalid email').transform(val => val.toLowerCase().trim()),
  password: passwordSchema,
  updated_at: zod.date(),
  created_at: zod.date(),
});

export type AdminAccount = zod.infer<typeof adminAccountSchema>;

export type AdminAccountTable = WithGeneratedIDAndTimestamps<AdminAccount>;

export const newAdminAccountSchema = adminAccountSchema.omit({ id: true, created_at: true, updated_at: true });
export type NewAdminAccount = zod.infer<typeof newAdminAccountSchema>;

export const adminAccountUpdate = adminAccountSchema.omit({ password: true, created_at: true, updated_at: true });
export type AdminAccountWithoutPassword = zod.infer<typeof adminAccountUpdate>;

// password_reset_token

export const passwordResetTokenSchema = zod.object({
  id: zod.number(),
  user_id: zod.number(),
  role: zod.enum(['organization', 'volunteer']),
  token: zod.string().min(1),
  expires_at: zod.date(),
  created_at: zod.date(),
});

export type PasswordResetToken = zod.infer<typeof passwordResetTokenSchema>;
export type PasswordResetTokenTable = WithGeneratedID<PasswordResetToken>;

// crisis

export const crisisSchema = zod.object({
  id: zod.number(),
  name: zod.string().trim().min(1, 'Crisis name is required').max(256, 'Crisis name can at most be 256 characters'),
  description: zod.string().trim().optional(),
  pinned: zod.boolean(),
  created_at: zod.date(),
});

export type Crisis = zod.infer<typeof crisisSchema>;
export type CrisisTable = WithGeneratedIDAndCreatedAt<Crisis>;

export const newCrisisSchema = crisisSchema.omit({
  id: true,
  pinned: true,
  created_at: true,
});
export type NewCrisis = zod.infer<typeof newCrisisSchema>;

// organization_posting

export const organizationPostingSchema = zod.object({
  id: zod.number(),
  organization_id: zod.number().min(1, 'Organization ID is required'),
  title: zod.string().min(1, 'Title is required'),
  description: zod.string().min(1, 'Description is required'),
  latitude: zod
    .number()
    .min(-90, { message: 'Latitude must be >= -90' })
    .max(90, { message: 'Latitude must be <= 90' })
    .optional(),
  longitude: zod
    .number()
    .min(-180, { message: 'Longitude must be >= -180' })
    .max(180, { message: 'Longitude must be <= 180' })
    .optional(),
  max_volunteers: zod.number().optional(),
  start_timestamp: zod.preprocess(val => val ? new Date(val as string) : val, zod.date({ message: 'Start time is required and must be a valid date' })),
  end_timestamp: zod.preprocess(val => val ? new Date(val as string) : undefined, zod.date({ message: 'End time must be a valid date' })).optional(),
  minimum_age: zod.number().optional(),
  automatic_acceptance: zod.boolean().default(true),
  is_closed: zod.boolean().default(false),
  crisis_id: zod.number().optional(),
  location_name: zod.string().min(2, 'Location must be longer than 2 characters'),
  opportunity_vector: zod.string().optional(),
  posting_context_vector: zod.string().optional(),
  updated_at: zod.date(),
  created_at: zod.date(),
});

export type OrganizationPosting = zod.infer<typeof organizationPostingSchema>;

export type OrganizationPostingTable = WithGeneratedIDAndTimestamps<OrganizationPosting>;

export const newOrganizationPostingSchema = organizationPostingSchema
  .omit({ id: true, opportunity_vector: true, posting_context_vector: true, created_at: true, updated_at: true })
  .extend({
    skills: zod
      .array(zod.string().min(1, 'Skill name is required'))
      .optional(),
  });
export type NewOrganizationPosting = zod.infer<typeof newOrganizationPostingSchema>;

export const organizationPostingWithoutVectorsSchema = organizationPostingSchema.omit({
  opportunity_vector: true,
  posting_context_vector: true,
});
export type OrganizationPostingWithoutVectors = zod.infer<typeof organizationPostingWithoutVectorsSchema>;

// posting_skill

export const postingSkillSchema = zod.object({
  id: zod.number(),
  posting_id: zod.number().min(1, 'Posting ID is required'),
  name: zod.string().min(1, 'Skill name is required'),
});

export type PostingSkill = zod.infer<typeof postingSkillSchema>;

export type PostingSkillTable = WithGeneratedID<PostingSkill>;

// volunteer_skill

export const volunteerSkillSchema = zod.object({
  id: zod.number(),
  volunteer_id: zod.number().min(1, 'Volunteer ID is required'),
  name: zod.string().min(1, 'Skill name is required'),
});

export type VolunteerSkill = zod.infer<typeof volunteerSkillSchema>;

export type VolunteerSkillTable = WithGeneratedID<VolunteerSkill>;

// enrollment

export const enrollmentSchema = zod.object({
  id: zod.number(),
  volunteer_id: zod.number().min(1, 'Volunteer ID is required'),
  posting_id: zod.number().min(1, 'Posting ID is required'),
  message: zod.string().max(350, 'Your message is too long. Please limit it to 350 characters.').optional(),
  created_at: zod.date(),
  attended: zod.boolean(),
});

export type Enrollment = zod.infer<typeof enrollmentSchema>;
export const newEnrollmentSchema = enrollmentSchema.omit({ id: true, created_at: true, attended: true });

export type EnrollmentTable = WithGeneratedIDAndCreatedAt<Enrollment>;

// enrollment_application

export const enrollmentApplicationSchema = zod.object({
  id: zod.number(),
  volunteer_id: zod.number().min(1, 'Volunteer ID is required'),
  posting_id: zod.number().min(1, 'Posting ID is required'),
  message: zod.string().max(350, 'Your message is too long. Please limit it to 350 characters.').optional(),
  created_at: zod.date(),
});

export type EnrollmentApplication = zod.infer<typeof enrollmentApplicationSchema>;
export const newEnrollmentApplicationSchema = enrollmentApplicationSchema.omit({ id: true, created_at: true });
export type EnrollmentApplicationTable = WithGeneratedIDAndCreatedAt<EnrollmentApplication>;

export interface Database {
  volunteer_account: VolunteerAccountTable;
  organization_request: OrganizationRequestTable;
  organization_account: OrganizationAccountTable;
  admin_account: AdminAccountTable;
  crisis: CrisisTable;
  organization_posting: OrganizationPostingTable;
  posting_skill: PostingSkillTable;
  volunteer_skill: VolunteerSkillTable;
  password_reset_token: PasswordResetTokenTable;
  enrollment: EnrollmentTable;
  enrollment_application: EnrollmentApplicationTable;
}
