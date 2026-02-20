import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('dap_attachments')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('dap_id', 'integer', (col) => col.notNull())
    .addColumn('type', 'varchar(32)', (col) => col.notNull())
    .addColumn('filename', 'varchar(255)', (col) => col.notNull())
    .addColumn('storage_path', 'varchar(1024)', (col) => col.notNull())
    .addColumn('uploaded_by_run', 'integer', (col) => col.notNull())
    .addColumn('mime_type', 'varchar(255)')
    .addColumn('size', 'integer')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_dap_attachments_dap_id')
    .on('dap_attachments')
    .column('dap_id')
    .execute();

  await db.schema
    .alterTable('dap_attachments')
    .addForeignKeyConstraint('fk_dap_attachments_dap', ['dap_id'], 'dap', ['id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  try {
    await db.schema.dropIndex('idx_dap_attachments_dap_id').ifExists().execute();
  } catch {
    // ignore
  }
  await db.schema.dropTable('dap_attachments').ifExists().execute();
}