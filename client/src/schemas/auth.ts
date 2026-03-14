import { z } from 'zod';

import {
  newOrganizationRequestSchema,
  newVolunteerAccountSchema,
  newOrganizationPostingSchema,
  passwordSchema,
} from '../../../server/src/db/tables';
import { loginInfoSchema } from '../../../server/src/types';

export const loginFormSchema = loginInfoSchema.extend({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const volunteerSignupSchema = newVolunteerAccountSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type VolunteerSignupFormData = z.infer<typeof volunteerSignupSchema>;

export const organizationRequestFormSchema = newOrganizationRequestSchema
  .omit({ latitude: true, longitude: true })
  .extend({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
  });

export type OrganizationRequestFormData = z.infer<typeof organizationRequestFormSchema>;

export const organizationPostingFormSchema = newOrganizationPostingSchema
  .omit({ organization_id: true, latitude: true, longitude: true })
  .extend({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    start_timestamp: z
      .string()
      .min(1, 'Start time is required')
      .refine(
        (val) => {
          const yearMatch = val.match(/^(\d+)-/);
          if (!yearMatch) return true;
          return yearMatch[1].length <= 4;
        },
        { message: 'Year must be 4 digits or less' },
      ),
    end_timestamp: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          const yearMatch = val.match(/^(\d+)-/);
          if (!yearMatch) return true;
          return yearMatch[1].length <= 4;
        },
        { message: 'Year must be 4 digits or less' },
      ),
    max_volunteers: z.string().optional(),
    minimum_age: z.string().optional(),
    automatic_acceptance: z.boolean(),
    is_closed: z.boolean(),
  });

export type OrganizationPostingFormData = z.infer<typeof organizationPostingFormSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.email('Invalid email'),
});

export type ForgotPasswordRequestFormData = z.infer<typeof forgotPasswordRequestSchema>;

export const forgotPasswordResetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ForgotPasswordResetFormData = z.infer<typeof forgotPasswordResetSchema>;
