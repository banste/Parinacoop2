import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('client_bank_account')
    .ifNotExists()
    .addColumn('user_run', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('rut_owner', 'varchar(12)', (col) => col.notNull())
    .addColumn('bank_code', 'varchar(20)', (col) => col.notNull())
    .addColumn('bank_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('account_type', 'varchar(30)', (col) => col.notNull())
    .addColumn('account_number', 'varchar(30)', (col) => col.notNull())
    .addColumn('email', 'varchar(150)')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('client_bank_account').ifExists().execute();
}