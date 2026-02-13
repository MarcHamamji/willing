import dotenv from 'dotenv';
import zod from 'zod';

dotenv.config();

const schema = zod.object({
  NODE_ENV: zod.enum(['development', 'production']).default('development'),

  POSTGRES_HOST: zod.string().nonempty(),
  POSTGRES_DB: zod.string().nonempty(),
  POSTGRES_USER: zod.string().nonempty(),
  POSTGRES_PASSWORD: zod.string().nonempty(),
  POSTGRES_PORT: zod.string().regex(/^[0-9]+$/).nonempty().transform(s => Number(s)),

  SERVER_PORT: zod.string().regex(/[0-9]+/).nonempty().transform(s => Number(s)),
  CLIENT_URL: zod.url().refine(url => !url.endsWith('/'), {
    error: 'The client url should not end with a trailing slash',
  }),

  JWT_SECRET: zod.string().nonempty(),

  SMTP_HOST: zod.preprocess(v => (v === '' ? undefined : v), zod.string().nonempty().optional()),
  SMTP_PORT: zod
    .preprocess(v => (v === '' ? undefined : v), zod.string().regex(/^[0-9]+$/).optional())
    .transform(s => (s === undefined ? undefined : Number(s))),
  SMTP_USER: zod.preprocess(v => (v === '' ? undefined : v), zod.string().nonempty().optional()),
  SMTP_PASS: zod.preprocess(v => (v === '' ? undefined : v), zod.string().nonempty().optional()),
  MAIL_FROM: zod.preprocess(v => (v === '' ? undefined : v), zod.string().nonempty().optional()),
}).superRefine((values, ctx) => {
  if (values.NODE_ENV === 'development') return;

  const required = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'MAIL_FROM',
  ] as const;

  for (const key of required) {
    if (values[key] === undefined) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required when NODE_ENV is not development`,
      });
    }
  }
});

const config = schema.parse(process.env);

export default config;
