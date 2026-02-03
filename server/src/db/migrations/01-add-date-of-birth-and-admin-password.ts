import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('admin_account')
    .addColumn('password', 'varchar(255)', col => col.notNull())
    .execute();

  await db.schema
    .alterTable('volunteer_account')
    .addColumn('date_of_birth', 'date', col => col.notNull())
    .execute();

  await db.schema
    .alterTable('volunteer_account')
    .dropConstraint('volunteer_account_password_key')
    .execute();

  await db.schema
    .alterTable('organization_account')
    .dropConstraint('organization_account_password_key')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('organization_account')
    .addUniqueConstraint('organization_account_password_key', ['password'])
    .execute();

  await db.schema
    .alterTable('volunteer_account')
    .addUniqueConstraint('volunteer_account_password_key', ['password'])
    .execute();

  await db.schema
    .alterTable('volunteer_account')
    .dropColumn('date_of_birth')
    .execute();

  await db.schema
    .alterTable('admin_account')
    .dropColumn('password')
    .execute();
}
