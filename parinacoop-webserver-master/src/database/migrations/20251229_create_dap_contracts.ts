import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Crear tabla - usar 'serial' para id autoincremental en Postgres
  await db.schema
    .createTable('dap_contracts')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('dap_id', 'integer', (col) => col.notNull())
    .addColumn('filename', 'varchar(255)', (col) => col.notNull())
    .addColumn('storage_path', 'varchar(1024)', (col) => col.notNull())
    .addColumn('uploaded_by_run', 'integer', (col) => col.notNull())
    // usar 'timestamp' y default now()
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  // Índice por dap_id
  await db.schema
    .createIndex('idx_dap_contracts_dap_id')
    .on('dap_contracts')
    .column('dap_id')
    .execute();

  // FK hacia la tabla dap (ajusta el nombre si tu tabla DAP se llama distinto)
  await db.schema
    .alterTable('dap_contracts')
    .addForeignKeyConstraint('fk_dap_contracts_dap', ['dap_id'], 'dap', ['id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('dap_contracts').ifExists().execute();
}