import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE volunteer_account
    ADD COLUMN IF NOT EXISTS cv_path varchar(256);
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE volunteer_account
    DROP COLUMN IF EXISTS cv_path;
  `.execute(db);
}
