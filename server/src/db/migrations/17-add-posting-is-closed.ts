import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Rename is_open to automatic_acceptance
  await db.schema
    .alterTable('organization_posting')
    .renameColumn('is_open', 'automatic_acceptance')
    .execute();

  // Add is_closed column
  await db.schema
    .alterTable('organization_posting')
    .addColumn('is_closed', 'boolean', col => col.defaultTo(false).notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Drop is_closed column
  await db.schema
    .alterTable('organization_posting')
    .dropColumn('is_closed')
    .execute();

  // Rename automatic_acceptance back to is_open
  await db.schema
    .alterTable('organization_posting')
    .renameColumn('automatic_acceptance', 'is_open')
    .execute();
}
