import zod from 'zod';

export type Role = 'admin' | 'volunteer' | 'organization';

export interface UserJWT {
  id: number;
  role: Role;
}

export const LoginInfoSchema = zod.object({
  email: zod.email(),
  password: zod.string(),
});

export type LoginInfo = zod.infer<typeof LoginInfoSchema>;
