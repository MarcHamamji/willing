import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('organization_posting')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('organization_id', 'integer', col => col.notNull().references('organization_account.id').onDelete('cascade'))
    .addColumn('title', 'varchar(256)', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull())
    .addColumn('latitude', 'numeric', col => col.notNull())
    .addColumn('longitude', 'numeric', col => col.notNull())
    .addColumn('max_volunteers', 'integer')
    .addColumn('start_timestamp', 'timestamp', col => col.notNull())
    .addColumn('end_timestamp', 'timestamp')
    .addColumn('minimum_age', 'integer')
    .addColumn('is_open', 'boolean')
    .execute();

  await db.schema
    .createTable('posting_skill')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('posting_id', 'integer', col => col.notNull().references('organization_posting.id').onDelete('cascade'))
    .addColumn('name', 'text', col => col.notNull())
    .execute();
  await db.schema
    .createTable('volunteer_skill')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('volunteer_id', 'integer', col => col.notNull().references('volunteer_account.id').onDelete('cascade'))
    .addColumn('name', 'text', col => col.notNull())
    .execute();
  await db.schema.alterTable('volunteer_account')
    .addColumn('description', 'text')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('volunteer_skill').execute();
  await db.schema.dropTable('posting_skill').execute();
  await db.schema.dropTable('organization_posting').execute();
  await db.schema.alterTable('volunteer_account').dropColumn('description').execute();
}
