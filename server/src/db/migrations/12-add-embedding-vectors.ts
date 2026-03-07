import { Kysely, sql } from 'kysely';

const VECTOR_DIM = 1536;

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS vector;`.execute(db);

  await sql`
    ALTER TABLE organization_account
    ADD COLUMN IF NOT EXISTS org_vector vector(${sql.raw(String(VECTOR_DIM))});
  `.execute(db);

  await sql`
    ALTER TABLE organization_posting
    ADD COLUMN IF NOT EXISTS opportunity_vector vector(${sql.raw(String(VECTOR_DIM))}),
    ADD COLUMN IF NOT EXISTS posting_context_vector vector(${sql.raw(String(VECTOR_DIM))});
  `.execute(db);

  await sql`
    ALTER TABLE volunteer_account
    ADD COLUMN IF NOT EXISTS profile_vector vector(${sql.raw(String(VECTOR_DIM))}),
    ADD COLUMN IF NOT EXISTS experience_vector vector(${sql.raw(String(VECTOR_DIM))});
  `.execute(db);

  await sql`
    ALTER TABLE enrollment
    DROP COLUMN IF EXISTS experience_vector;
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_organization_account_org_vector
    ON organization_account
    USING ivfflat (org_vector vector_cosine_ops)
    WITH (lists = 100);
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_organization_posting_opportunity_vector
    ON organization_posting
    USING ivfflat (opportunity_vector vector_cosine_ops)
    WITH (lists = 100);
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_organization_posting_context_vector
    ON organization_posting
    USING ivfflat (posting_context_vector vector_cosine_ops)
    WITH (lists = 100);
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_volunteer_account_profile_vector
    ON volunteer_account
    USING ivfflat (profile_vector vector_cosine_ops)
    WITH (lists = 100);
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_volunteer_account_experience_vector
    ON volunteer_account
    USING ivfflat (experience_vector vector_cosine_ops)
    WITH (lists = 100);
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_volunteer_account_experience_vector;`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_volunteer_account_profile_vector;`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_organization_posting_context_vector;`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_organization_posting_opportunity_vector;`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_organization_account_org_vector;`.execute(db);

  await sql`
    ALTER TABLE volunteer_account
    DROP COLUMN IF EXISTS profile_vector,
    DROP COLUMN IF EXISTS experience_vector;
  `.execute(db);

  await sql`
    ALTER TABLE organization_posting
    DROP COLUMN IF EXISTS opportunity_vector,
    DROP COLUMN IF EXISTS posting_context_vector;
  `.execute(db);

  await sql`
    ALTER TABLE organization_account
    DROP COLUMN IF EXISTS org_vector;
  `.execute(db);

  await sql`
    ALTER TABLE enrollment
    ADD COLUMN IF NOT EXISTS experience_vector vector;
  `.execute(db);
}
