import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('organization_posting')
    .addColumn('location_name', 'varchar(128)')
    .execute();
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('organization_posting')
    .dropColumn('location_name')
    .execute();
}
