import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('organization_account')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar', col => col.notNull())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('phone_number', 'varchar(32)', col => col.notNull().unique())
    .addColumn('url', 'varchar(256)', col => col.notNull().unique())
    .addColumn('latitude', 'numeric')
    .addColumn('longitude', 'numeric')
    .addColumn('password', 'varchar(256)', col => col.notNull().unique())
    .addColumn('location_name', 'varchar(256)', col => col.notNull())
    .execute();

  await db.schema
    .createTable('organization_request')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('name', 'varchar(128)', col => col.notNull())
    .addColumn('phone_number', 'varchar(32)')
    .addColumn('url', 'varchar(256)', col => col.notNull().unique())
    .addColumn('latitude', 'numeric')
    .addColumn('longitude', 'numeric')
    .addColumn('location_name', 'varchar(256)', col => col.notNull())
    .execute();

  await db.schema
    .createTable('volunteer_account')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('first_name', 'varchar(128)', col => col.notNull())
    .addColumn('last_name', 'varchar(128)', col => col.notNull())
    .addColumn('gender', 'varchar(64)', col => col.notNull())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('phone_number', 'varchar(32)', col => col.notNull().unique())
    .addColumn('password', 'varchar(256)', col => col.notNull().unique())
    .execute();

  await db.schema
    .createTable('admin_account')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('first_name', 'varchar(64)', col => col.notNull())
    .addColumn('last_name', 'varchar(64)', col => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('admin_account').execute();
  await db.schema.dropTable('volunteer_account').execute();
  await db.schema.dropTable('organization_request').execute();
  await db.schema.dropTable('organization_account').execute();
}
