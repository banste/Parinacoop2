import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('dap_contracts')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('dap_id', 'integer', (col) => col.notNull())
    .addColumn('filename', 'varchar(255)', (col) => col.notNull())
    .addColumn('storage_path', 'varchar(1024)', (col) => col.notNull())
    .addColumn('uploaded_by_run', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_dap_contracts_dap_id')
    .on('dap_contracts')
    .column('dap_id')
    .execute();

  await db.schema
    .alterTable('dap_contracts')
    .addForeignKeyConstraint('fk_dap_contracts_dap', ['dap_id'], 'dap', ['id'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('dap_contracts').ifExists().execute();
}