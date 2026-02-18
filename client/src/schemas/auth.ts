import { z } from 'zod';

import { newOrganizationRequestSchema, newVolunteerAccountSchema } from '../../../server/src/db/tables';
import { loginInfoSchema } from '../../../server/src/types';

export const loginFormSchema = loginInfoSchema.extend({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const volunteerSignupSchema = newVolunteerAccountSchema
  .extend({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
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
