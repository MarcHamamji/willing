import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('volunteer_account')
    .addColumn('date_of_birth', 'date')
    .execute();

  await db.schema
    .alterTable('admin_account')
    .addColumn('password', 'varchar(256)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('volunteer_account')
    .dropColumn('date_of_birth')
    .execute();

  await db.schema
    .alterTable('admin_account')
    .dropColumn('password')
    .execute();
}
