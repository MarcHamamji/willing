import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('organization_table_info')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('hours_threshold', 'integer')
    .addColumn('signatory_name', 'varchar(128)')
    .addColumn('signature_path', 'varchar(256)')
    .execute();

  await db.schema
    .alterTable('organization_account')
    .addColumn('certificate_info_id', 'integer', col =>
      col.references('organization_table_info.id').onDelete('cascade'),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('organization_account')
    .dropColumn('certificate_info_id')
    .execute();

  await db.schema
    .dropTable('organization_table_info')
    .execute();
}
