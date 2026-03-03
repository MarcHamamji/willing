import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('enrollment_application')
    .addColumn('posting_id', 'serial', col =>
      col.references('organization_posting.id').onDelete('cascade'),
    )
    .execute();

  await db.schema.alterTable('enrollment_application')
    .dropConstraint('enrollment_application_enrollment_id_fkey')
    .execute();

  await db.schema.alterTable('enrollment_application')
    .dropColumn('enrollment_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('enrollment_application')
    .addColumn('enrollment_id', 'serial', col =>
      col.references('enrollment.id').onDelete('cascade'),
    )
    .execute();

  await db.schema.alterTable('enrollment_application')
    .dropColumn('posting_id')
    .execute();
}
