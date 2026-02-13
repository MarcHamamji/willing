import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './tables.js';

import config from '../config.js';

const dialect = new PostgresDialect({
  pool: new Pool({
    database: config.POSTGRES_DB,
    host: config.POSTGRES_HOST,
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    port: config.POSTGRES_PORT,
    max: 10,
  }),
});

export default new Kysely<Database>({
  dialect,
});
