import dotenv from 'dotenv';
import zod from 'zod';

dotenv.config();

const optionalInDev = <T>(schema: zod.ZodType<T>): zod.ZodType<T> =>
  zod.preprocess(val => (val === '' ? undefined : val), schema);

const schema = zod.object({
  NODE_ENV: zod.enum(['development', 'production']).default('development'),

  POSTGRES_HOST: zod.string().min(1),
  POSTGRES_DB: zod.string().min(1),
  POSTGRES_USER: zod.string().min(1),
  POSTGRES_PASSWORD: zod.string().min(1),
  POSTGRES_PORT: zod.coerce.number(),

  SERVER_PORT: zod.string().regex(/[0-9]+/),
  CLIENT_URL: zod.url().refine(url => !url.endsWith('/'), {
    message: 'The client url should not end with a trailing slash',
  }),

  JWT_SECRET: zod.string().min(1),

  OPENAI_API_KEY: optionalInDev(zod.string().optional()),
  SMTP_HOST: optionalInDev(zod.string().optional()),
  SMTP_PORT: optionalInDev(zod.coerce.number().optional()),
  SMTP_USER: optionalInDev(zod.string().optional()),
  SMTP_PASS: optionalInDev(zod.string().optional()),
  MAIL_FROM: optionalInDev(zod.string().optional()),

  LOCATION_IQ_API_KEY: optionalInDev(zod.string().optional()),
  CV_UPLOAD_DIR: zod.string().min(1),
})
  .superRefine((values, ctx) => {
    if (values.NODE_ENV === 'development') return;

    const prodRequired: (keyof typeof values)[] = [
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'LOCATION_IQ_API_KEY',
    ];

    prodRequired.forEach((key) => {
      if (!values[key]) {
        ctx.addIssue({
          code: 'invalid_type',
          path: [key],
          expected: 'string',
          received: 'undefined',
          message: `${key} is required in production`,
        });
      }
    });
  });

const config = schema.parse(process.env);

export default config;
