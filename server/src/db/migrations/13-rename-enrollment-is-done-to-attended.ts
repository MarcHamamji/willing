import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('enrollment')
    .renameColumn('is_done', 'attended')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('enrollment')
    .renameColumn('attended', 'is_done')
    .execute();
}
