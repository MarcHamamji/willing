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
});

const config = schema.parse(process.env);

export default config;
