import dotenv from 'dotenv';
import zod from 'zod';

dotenv.config();

const schema = zod.object({
  POSTGRES_HOST: zod.string().nonempty(),
  POSTGRES_DB: zod.string().nonempty(),
  POSTGRES_USER: zod.string().nonempty(),
  POSTGRES_PASSWORD: zod.string().nonempty(),
  POSTGRES_PORT: zod.string().regex(/^[0-9]+$/).nonempty().transform(s => Number(s)),

  PGADMIN_EMAIL: zod.email(),
  PGADMIN_PASSWORD: zod.string(),

  NODE_ENV: zod.enum(['development', 'production']).default('development'),
  HOST: zod.string().nonempty(),
  SERVER_PORT: zod.string().regex(/[0-9]+/).nonempty().transform(s => Number(s)),

  JWT_SECRET: zod.string().nonempty(),
  CLIENT_URL: zod.url(),
});

const config = schema.parse(process.env);

export default config;
