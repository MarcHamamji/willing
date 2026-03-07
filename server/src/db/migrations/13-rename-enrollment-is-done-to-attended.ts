import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'enrollment' AND column_name = 'is_done'
      ) THEN
        ALTER TABLE enrollment RENAME COLUMN is_done TO attended;
      END IF;
    END $$;
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'enrollment' AND column_name = 'attended'
      ) THEN
        ALTER TABLE enrollment RENAME COLUMN attended TO is_done;
      END IF;
    END $$;
  `.execute(db);
}
