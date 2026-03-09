import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('volunteer_account')
    .addColumn('cv_file', 'varchar(255)')
    .execute();
}
export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('volunteer_account')
    .dropColumn('cv_file')
    .execute();
}
