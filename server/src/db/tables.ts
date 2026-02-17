import { Generated } from 'kysely';
import zod from 'zod';

type WithGeneratedID<T> = Omit <T, 'id'> & {
  id: Generated<number>;
};

export interface Database {
  volunteer_account: VolunteerAccountTable;
  organization_request: OrganizationRequestTable;
  organization_account: OrganizationAccountTable;
  admin_account: AdminAccountTable;
  organization_posting: OrganizationPostingTable;
  posting_skill: PostingSkillTable;
  volunteer_skill: VolunteerSkillTable;
}

export const volunteerAccountSchema = zod.object({
  id: zod.number(),
  first_name: zod.string().min(1, 'First name is required'),
  last_name: zod.string().min(1, 'Last name is required'),
  email: zod.email('Invalid email').transform(val => val.toLowerCase().trim()),
  password: zod
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  date_of_birth: zod
    .string()
    .min(1, 'Date of birth is required')
    .refine(str => !isNaN(Date.parse(str)), { message: 'Invalid date format' }),
  gender: zod.enum(['male', 'female', 'other'], 'Gender should be \'female\', \'male\', or \'other\' '),
  description: zod.string().optional(),
});
export type VolunteerAccount = zod.infer<typeof volunteerAccountSchema>;

export type VolunteerAccountTable = WithGeneratedID<VolunteerAccount>;

export const newVolunteerAccountSchema = volunteerAccountSchema.omit({ id: true });
export type NewVolunteerAccount = zod.infer<typeof newVolunteerAccountSchema>;

export const volunteerAccountWithoutPasswordSchema = volunteerAccountSchema.omit({ password: true });
export type VolunteerAccountWithoutPassword = zod.infer<typeof newVolunteerAccountSchema>;

export const organizationRequestSchema = zod.object({
  id: zod.number(),
  name: zod.string().min(1, 'Name is required'),
  email: zod.string().email('Invalid email').transform(val => val.toLowerCase().trim()),
  phone_number: zod.e164('Phone number is invalid'),
  url: zod.url('URL is invalid'),
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
});

export type OrganizationRequest = zod.infer<typeof organizationRequestSchema>;

export type OrganizationRequestTable = WithGeneratedID<OrganizationRequest>;

export const newOrganizationRequestSchema = organizationRequestSchema.omit({ id: true });
export type NewOrganizationRequest = zod.infer<typeof newOrganizationRequestSchema>;

export const organizationAccountSchema = zod.object({
  id: zod.number(),
  name: zod.string().min(1, 'Name is required'),
  email: zod.string().email('Invalid email').transform(val => val.toLowerCase().trim()),
  phone_number: zod.e164('Phone number is invalid'),
  url: zod.url('URL is invalid'),
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
  password: zod
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type OrganizationAccount = zod.infer<typeof organizationAccountSchema>;

export type OrganizationAccountTable = WithGeneratedID<OrganizationAccount>;

export const newOrganizationAccountSchema = organizationAccountSchema.omit({ id: true });
export type NewOrganizationAccount = zod.infer<typeof newOrganizationAccountSchema>;

export const organizationAccountUpdate = organizationAccountSchema.omit({ password: true });
export type OrganizationAccountWithoutPassword = zod.infer<typeof organizationAccountUpdate>;

export const adminAccountSchema = zod.object({
  id: zod.number(),
  first_name: zod.string().min(1, 'first name should have at least 1 character'),
  last_name: zod.string().min(1, 'last name should have at least 1 character'),
  email: zod.string().email('Invalid email').transform(val => val.toLowerCase().trim()),
  password: zod
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type AdminAccount = zod.infer <typeof adminAccountSchema>;

export type AdminAccountTable = WithGeneratedID<AdminAccount>;

export const newAdminAccountSchema = adminAccountSchema.omit({ id: true });
export type NewAdminAccount = zod.infer<typeof newAdminAccountSchema>;

export const adminAccountUpdate = adminAccountSchema.omit({ password: true });
export type AdminAccountWithoutPassword = zod.infer<typeof adminAccountUpdate>;

export const organizationPostingSchema = zod.object({
  id: zod.number(),
  organization_id: zod.number().min(1, 'Organization ID is required'),
  title: zod.string().min(1, 'Title is required'),
  description: zod.string().min(1, 'Description is required'),
  latitude: zod
    .number()
    .min(-90, { message: 'Latitude must be >= -90' })
    .max(90, { message: 'Latitude must be <= 90' }),
  longitude: zod
    .number()
    .min(-180, { message: 'Longitude must be >= -180' })
    .max(180, { message: 'Longitude must be <= 180' }),
  max_volunteers: zod.number().optional(),
  start_timestamp: zod.preprocess(val => val ? new Date(val as string) : val, zod.date({ message: 'Start time is required and must be a valid date' })),
  end_timestamp: zod.preprocess(val => val ? new Date(val as string) : undefined, zod.date({ message: 'End time must be a valid date' })).optional(),
  minimum_age: zod.number().optional(),
  is_open: zod.boolean().default(true),
  location_name: zod.string().min(2, 'Location must be longer than 2 characters'),
});

export type OrganizationPosting = zod.infer<typeof organizationPostingSchema>;

export type OrganizationPostingTable = WithGeneratedID<OrganizationPosting>;

export const newOrganizationPostingSchema = organizationPostingSchema
  .omit({ id: true })
  .extend({ skills: zod
    .array(zod.string().min(1, 'Skill name is required'))
    .optional(),
  });
export type NewOrganizationPosting = zod.infer<typeof newOrganizationPostingSchema>;

export const PostingSkillSchema = zod.object({
  id: zod.number(),
  posting_id: zod.number().min(1, 'Posting ID is required'),
  name: zod.string().min(1, 'Skill name is required'),
});

export type PostingSkill = zod.infer<typeof PostingSkillSchema>;

export type PostingSkillTable = WithGeneratedID<PostingSkill>;

export const VolunteerSkillSchema = zod.object({
  id: zod.number(),
  volunteer_id: zod.number().min(1, 'Volunteer ID is required'),
  name: zod.string().min(1, 'Skill name is required'),
});

export type VolunteerSkill = zod.infer<typeof VolunteerSkillSchema>;

export type VolunteerSkillTable = WithGeneratedID<VolunteerSkill>;
