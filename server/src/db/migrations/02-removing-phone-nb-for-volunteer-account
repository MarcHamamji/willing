import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('volunteer_account')
    .dropColumn('phone_number')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('volunteer_account')
    .addColumn('phone_number', 'varchar(20)') 
    .execute();
}
