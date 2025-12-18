import { Migration, sql } from 'kysely';
import { regions_communes } from '../seed/regions';

export const up: Migration['up'] = async (db) => {
  // =========================
  // REGION
  // =========================
  await db.schema
    .createTable('region')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(50)', (col) => col.notNull())
    .addColumn('roman_number', 'varchar(10)', (col) => col.notNull())
    .addColumn('number', 'smallint', (col) => col.notNull())
    .addColumn('abbreviation', 'varchar(10)', (col) => col.notNull())
    .execute();

  // =========================
  // COMMUNE
  // =========================
  await db.schema
    .createTable('commune')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('postal_code', 'integer', (col) => col.notNull())
    .addColumn('region_id', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_region_commune',
      ['region_id'],
      'region',
      ['id'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // ✅ SEED REGIONS + COMMUNES desde tu regions.ts
  for (const r of regions_communes) {
    const inserted = await db
      .insertInto('region')
      .values({
        name: r.name,
        roman_number: r.roman_number,
        number: r.number,
        abbreviation: r.abbreviation,
      })
      .returning('id')
      .executeTakeFirst();

    const regionId = inserted!.id;

    if (r.communes?.length) {
      await db
        .insertInto('commune')
        .values(
          r.communes.map((c) => ({
            name: c.name,
            postal_code: c.postal_code,
            region_id: regionId,
          })),
        )
        .execute();
    }
  }

  // =========================
  // PARAMETER (DAP)
  // =========================
  await db.schema
    .createTable('parameter')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('minimum_days', 'integer', (col) => col.notNull())
    .addColumn('maximum_days', 'integer', (col) => col.notNull())
    .addColumn('interest_rate_base', 'decimal(7, 4)', (col) => col.notNull())
    .execute();

  // ✅ SEED PARAMETER (según tu parameters.ts)
  await db
    .insertInto('parameter')
    .values([
      { minimum_days: 30, maximum_days: 90, interest_rate_base: 0.4 },
      { minimum_days: 91, maximum_days: 180, interest_rate_base: 0.39 },
      { minimum_days: 181, maximum_days: 365, interest_rate_base: 0.39 },
      { minimum_days: 366, maximum_days: 9999, interest_rate_base: 5 },
    ])
    .execute();

  // =========================
  // USER (AUTH)
  // =========================
  await db.schema
    .createTable('user')
    .addColumn('run', 'integer', (col) => col.primaryKey())
    .addColumn('role', 'varchar(20)', (col) => col.notNull())
    .addColumn('password', 'varchar(255)', (col) => col.notNull())
    .addColumn('password_attempts', 'smallint', (col) =>
      col.notNull().defaultTo(3),
    )
    .addColumn('enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // =========================
  // CLIENT_PROFILE
  // =========================
  await db.schema
    .createTable('client_profile')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_run', 'integer', (col) => col.notNull().unique())
    .addColumn('document_number', 'integer', (col) => col.notNull().unique())
    .addColumn('email', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('cellphone', 'varchar(20)', (col) => col.notNull())
    .addColumn('names', 'varchar(100)')
    .addColumn('first_last_name', 'varchar(50)')
    .addColumn('second_last_name', 'varchar(50)')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addForeignKeyConstraint(
      'fk_user_client_profile',
      ['user_run'],
      'user',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // =========================
  // ADDRESS
  // =========================
  await db.schema
    .createTable('address')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('type_address', 'varchar(20)', (col) => col.notNull())
    .addColumn('street', 'varchar(100)', (col) => col.notNull())
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('detail', 'varchar(100)')
    .addColumn('commune_id', 'integer')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addForeignKeyConstraint(
      'fk_user_address',
      ['user_run'],
      'user',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .addForeignKeyConstraint(
      'fk_commune_address',
      ['commune_id'],
      'commune',
      ['id'],
      (cb) => cb.onDelete('set null'),
    )
    .execute();

  // =========================
  // PASSWORD_RESET
  // =========================
  await db.schema
    .createTable('password_reset')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('token', 'varchar(255)', (col) => col.notNull())
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addForeignKeyConstraint(
      'fk_user_password_reset',
      ['user_run'],
      'user',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // =========================
  // DAP
  // =========================
  await db.schema
    .createTable('dap')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('type', 'varchar(20)', (col) => col.notNull())
    .addColumn('currency_type', 'varchar(10)', (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull())
    .addColumn('days', 'smallint', (col) => col.notNull())
    .addColumn('initial_date', 'date', (col) => col.notNull())
    .addColumn('initial_amount', 'integer', (col) =>
      col.notNull().check(sql`initial_amount >= 50000`),
    )
    .addColumn('due_date', 'date', (col) => col.notNull())
    .addColumn('final_amount', 'integer', (col) => col.notNull())
    .addColumn('profit', 'integer', (col) => col.notNull())
    .addColumn('interest_rate_in_period', 'decimal(7, 4)', (col) =>
      col.notNull(),
    )
    .addColumn('interest_rate_in_month', 'decimal(7, 4)', (col) =>
      col.notNull(),
    )
    .addForeignKeyConstraint(
      'fk_user_dap',
      ['user_run'],
      'user',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // =========================
  // SAVINGS_ACCOUNT
  // =========================
  await db.schema
    .createTable('savings_account')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('initial_amount', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('currency_type', 'varchar(20)', (col) => col.notNull())
    .addColumn('interest_rate', 'decimal(7, 4)', (col) => col.notNull())
    .addColumn('initial_date', 'date', (col) => col.notNull())
    .addColumn('close_date', 'date')
    .addColumn('contract_url', 'varchar(255)')
    .addColumn('contract_hash', 'varchar(128)')
    .addColumn('contract_signed', 'boolean', (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn('contract_date', 'date')
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addForeignKeyConstraint(
      'fk_user_savings_account',
      ['user_run'],
      'user',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // =========================
  // WITHDRAWAL
  // =========================
  await db.schema
    .createTable('withdrawal')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('savings_account_id', 'integer', (col) => col.notNull())
    .addColumn('amount', 'decimal(12, 2)', (col) => col.notNull())
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addForeignKeyConstraint(
      'fk_withdrawal_savings_account',
      ['savings_account_id'],
      'savings_account',
      ['id'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();
};

export const down: Migration['down'] = async (db) => {
  await db.schema.dropTable('withdrawal').execute();
  await db.schema.dropTable('savings_account').execute();
  await db.schema.dropTable('dap').execute();
  await db.schema.dropTable('password_reset').execute();
  await db.schema.dropTable('address').execute();
  await db.schema.dropTable('client_profile').execute();
  await db.schema.dropTable('user').execute();
  await db.schema.dropTable('parameter').execute();
  await db.schema.dropTable('commune').execute();
  await db.schema.dropTable('region').execute();
};