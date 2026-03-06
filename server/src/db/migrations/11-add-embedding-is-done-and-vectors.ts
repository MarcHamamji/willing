import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('enrollment')
    .addColumn('is_done', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('experience_vector', sql`vector`)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('enrollment')
    .dropColumn('experience_vector')
    .dropColumn('is_done')
    .execute();
}
