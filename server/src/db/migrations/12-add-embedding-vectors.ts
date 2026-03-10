import { Kysely, sql } from 'kysely';

const VECTOR_DIM = 1536;
const VECTOR_DIM_TYPE = sql`vector(${sql.raw(String(VECTOR_DIM))})`;

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('organization_account')
    .addColumn('org_vector', VECTOR_DIM_TYPE)
    .execute();

  await db.schema
    .alterTable('organization_posting')
    .addColumn('opportunity_vector', VECTOR_DIM_TYPE)
    .execute();

  await db.schema
    .alterTable('organization_posting')
    .addColumn('posting_context_vector', VECTOR_DIM_TYPE)
    .execute();

  await db.schema
    .alterTable('volunteer_account')
    .addColumn('profile_vector', VECTOR_DIM_TYPE)
    .execute();

  await db.schema
    .alterTable('volunteer_account')
    .addColumn('experience_vector', VECTOR_DIM_TYPE)
    .execute();

  await db.schema
    .alterTable('enrollment')
    .dropColumn('experience_vector')
    .execute();

  await db.schema
    .createIndex('idx_organization_account_org_vector')
    .ifNotExists()
    .on('organization_account')
    .using('ivfflat')
    .column('org_vector')
    .execute();

  await db.schema
    .createIndex('idx_organization_posting_opportunity_vector')
    .ifNotExists()
    .on('organization_posting')
    .using('ivfflat')
    .column('opportunity_vector')
    .execute();

  await db.schema
    .createIndex('idx_organization_posting_context_vector')
    .ifNotExists()
    .on('organization_posting')
    .using('ivfflat')
    .column('posting_context_vector')
    .execute();

  await db.schema
    .createIndex('idx_volunteer_account_profile_vector')
    .ifNotExists()
    .on('volunteer_account')
    .using('ivfflat')
    .column('profile_vector')
    .execute();

  await db.schema
    .createIndex('idx_volunteer_account_experience_vector')
    .ifNotExists()
    .on('volunteer_account')
    .using('ivfflat')
    .column('experience_vector')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_volunteer_account_experience_vector').ifExists().execute();
  await db.schema.dropIndex('idx_volunteer_account_profile_vector').ifExists().execute();
  await db.schema.dropIndex('idx_organization_posting_context_vector').ifExists().execute();
  await db.schema.dropIndex('idx_organization_posting_opportunity_vector').ifExists().execute();
  await db.schema.dropIndex('idx_organization_account_org_vector').ifExists().execute();

  await db.schema
    .alterTable('volunteer_account')
    .dropColumn('profile_vector')
    .execute();

  await db.schema
    .alterTable('volunteer_account')
    .dropColumn('experience_vector')
    .execute();

  await db.schema
    .alterTable('organization_posting')
    .dropColumn('opportunity_vector')
    .execute();

  await db.schema
    .alterTable('organization_posting')
    .dropColumn('posting_context_vector')
    .execute();

  await db.schema
    .alterTable('organization_account')
    .dropColumn('org_vector')
    .execute();

  await db.schema
    .alterTable('enrollment')
    .addColumn('experience_vector', sql`vector`)
    .execute();
}
