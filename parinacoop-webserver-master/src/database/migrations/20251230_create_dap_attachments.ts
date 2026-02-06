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
    .addColumn('mime_type', 'varchar(255)') // opcional
    .addColumn('size', 'integer') // opcional
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // Índice para búsquedas por dap_id
  await db.schema
    .createIndex('idx_dap_attachments_dap_id')
    .on('dap_attachments')
    .column('dap_id')
    .execute();

  // Añadir FK a dap(id). Nota: si la tabla `dap` no existe todavía,
  // esta llamada fallará; asegúrate del orden de las migraciones.
  await db.schema
    .alterTable('dap_attachments')
    .addForeignKeyConstraint('fk_dap_attachments_dap', ['dap_id'], 'dap', ['id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Eliminar índice si existe
  try {
    await db.schema.dropIndex('idx_dap_attachments_dap_id').ifExists().execute();
  } catch {
    // ignorar en caso de que no exista o la versión de Kysely no soporte ifExists
  }

  // DROP TABLE elimina las FK asociadas automáticamente en la mayoría de RDBMS,
  // por eso evitamos llamar a un método de dropForeignKeyConstraint no soportado.
  await db.schema.dropTable('dap_attachments').ifExists().execute();
}