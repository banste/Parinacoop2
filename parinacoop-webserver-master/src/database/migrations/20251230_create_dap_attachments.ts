import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('dap_attachments')
    .ifNotExists()
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('dap_id', 'integer', (col) => col.notNull())
    .addColumn('type', 'varchar(32)', (col) => col.notNull()) // 'receipt' | 'signed_document'
    .addColumn('filename', 'varchar(255)', (col) => col.notNull())
    .addColumn('storage_path', 'varchar(1024)', (col) => col.notNull())
    .addColumn('uploaded_by_run', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_dap_attachments_dap_id')
    .on('dap_attachments')
    .column('dap_id')
    .execute();

  // CORRECCIÓN: referenciar PK de dap ahora es 'id'
  await db.schema
    .alterTable('dap_attachments')
    .addForeignKeyConstraint('fk_dap_attachments_dap', ['dap_id'], 'dap', ['id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('dap_attachments').ifExists().execute();
}