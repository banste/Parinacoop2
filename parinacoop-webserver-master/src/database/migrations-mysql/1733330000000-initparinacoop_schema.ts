import { Migration, sql } from 'kysely';
import { parameters } from '../seed/parameters';
import { regions_communes } from '../seed/regions';

/**
 * Migración MySQL (nombres en inglés):
 * - Usa `integer + autoIncrement()` en PK autoincrementales.
 * - Region/Commune en inglés para consistencia con Kysely types.
 * - Elimina la tabla legacy `direccion` (no se crea).
 *
 * Nota: esta migración asume una BD vacía o que puedes resetear.
 * Si ya tienes tablas en español, hay que crear una migración de ALTER TABLE/RENAME.
 */
export const up: Migration['up'] = async (db) => {
  // REGION
  await db.schema
    .createTable('region')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('roman_number', 'varchar(10)', (col) => col.notNull())
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('abbreviation', 'varchar(10)', (col) => col.notNull())
    .execute();

  // COMMUNE — uses region_id (the app expects region_id)
  await db.schema
    .createTable('commune')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('postal_code', 'varchar(20)', (col) => col.notNull())
    .addColumn('region_id', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint('fk_commune_region', ['region_id'], 'region', ['id'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // SEED REGIONS + COMMUNES (src/database/seed/regions.ts)
  // No usamos returning (Postgres-only), por eso recuperamos el id por name.
  for (const r of regions_communes) {
    const existingRegion = await db
      .selectFrom('region')
      .select(['id'])
      .where('name', '=', r.name)
      .executeTakeFirst();

    if (!existingRegion) {
      await db
        .insertInto('region')
        .values({
          name: r.name,
          roman_number: r.roman_number,
          number: r.number,
          abbreviation: r.abbreviation,
        })
        .execute();
    }

    const regionRow = await db
      .selectFrom('region')
      .select(['id'])
      .where('name', '=', r.name)
      .executeTakeFirstOrThrow();

    const regionId = Number((regionRow as any).id);

    for (const c of r.communes) {
      const existingCommune = await db
        .selectFrom('commune')
        .select(['id'])
        .where('name', '=', c.name)
        .where('region_id', '=', regionId)
        .executeTakeFirst();

      if (!existingCommune) {
        await db
          .insertInto('commune')
          .values({
            name: c.name,
            // seed trae number; en DB es varchar(20)
            postal_code: String(c.postal_code),
            region_id: regionId,
          })
          .execute();
      }
    }
  }

  // USER (authentication) -- run as INTEGER
  await db.schema
    .createTable('user')
    .ifNotExists()
    .addColumn('run', 'integer', (col) => col.primaryKey())
    .addColumn('role', 'varchar(10)', (col) => col.notNull())
    .addColumn('password', 'varchar(255)', (col) => col.notNull())
    .addColumn('password_attempts', 'smallint', (col) => col.notNull().defaultTo(3))
    .addColumn('enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();

  // CLIENT_PROFILE (separate) -- FK to user.run
  await db.schema
    .createTable('client_profile')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('user_run', 'integer', (col) => col.unique().notNull())
    .addColumn('document_number', 'varchar(20)')
    .addColumn('email', 'varchar(255)')
    .addColumn('cellphone', 'varchar(20)')
    .addColumn('names', 'varchar(150)')
    .addColumn('first_last_name', 'varchar(50)')
    .addColumn('second_last_name', 'varchar(50)')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`))
    .addForeignKeyConstraint('fk_clientprofile_user', ['user_run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // DAP (PK = id)
  await db.schema
    .createTable('dap')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('type', 'varchar(50)', (col) => col.notNull())
    .addColumn('currency_type', 'varchar(20)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull())
    .addColumn('days', 'integer', (col) => col.notNull())
    .addColumn('initial_date', 'timestamp', (col) => col.notNull())
    .addColumn('initial_amount', 'numeric', (col) => col.notNull())
    .addColumn('due_date', 'timestamp', (col) => col.notNull())
    .addColumn('final_amount', 'numeric', (col) => col.notNull())
    .addColumn('profit', 'numeric')
    .addColumn('interest_rate_in_month', 'numeric')
    .addColumn('interest_rate_in_period', 'numeric')
    .addForeignKeyConstraint('fk_dap_user', ['user_run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // DAP_INSTRUCTIONS
  await db.schema
    .createTable('dap_instructions')
    .ifNotExists()
    .addColumn('id_dap_instructions', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('bank_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('account_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('account_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('account_holder_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('account_holder_rut', 'varchar(15)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`))
    .execute();

  // dap_internal_ids
  await db.schema
    .createTable('dap_internal_ids')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('dap_id', 'integer', (col) => col.notNull())
    .addColumn('internal_id', 'varchar(100)', (col) => col.notNull())
    .addColumn('created_by_run', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addForeignKeyConstraint('fk_dapinternal_dap', ['dap_id'], 'dap', ['id'], (cb) =>
      cb.onDelete('cascade'),
    )
    .addForeignKeyConstraint('fk_dapinternal_user', ['created_by_run'], 'user', ['run'], (cb) =>
      cb.onDelete('restrict'),
    )
    .execute();

  await db.schema
    .createIndex('ux_dap_internal_id')
    .on('dap_internal_ids')
    .columns(['internal_id'])
    .unique()
    .execute();

  // passwordreset
  await db.schema
    .createTable('passwordreset')
    .ifNotExists()
    .addColumn('id_passwordreset', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('token', 'varchar(255)', (col) => col.notNull())
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull())
    .addColumn('expiration', 'timestamp', (col) => col.notNull())
    .addColumn('fecha_creacion', 'timestamp', (col) => col.defaultTo(sql`now()`))
    .addColumn('used_at', 'timestamp')
    .addColumn('run', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint('fk_password_user', ['run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  await db.schema.createIndex('idx_passwordreset_token_hash').on('passwordreset').columns(['token_hash']).execute();
  await db.schema.createIndex('idx_passwordreset_run').on('passwordreset').columns(['run']).execute();
  await db.schema.createIndex('idx_passwordreset_expiration').on('passwordreset').columns(['expiration']).execute();

  // cuenta_ahorro (mantengo el nombre de tabla/columnas tal como lo tienes hoy; si quieres, lo traducimos después)
  await db.schema
    .createTable('cuenta_ahorro')
    .ifNotExists()
    .addColumn('id_cuentaahorro', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('monto_inicial', 'numeric', (col) => col.notNull())
    .addColumn('tipo_moneda', 'varchar(20)', (col) => col.notNull())
    .addColumn('tasa_de_interes', 'numeric', (col) => col.notNull())
    .addColumn('fecha_inicial', 'date', (col) => col.notNull())
    .addColumn('fecha_cierre', 'date')
    .addColumn('run', 'integer', (col) => col.notNull())
    .addColumn('contrato_url', 'varchar(255)')
    .addColumn('contrato_hash', 'varchar(128)')
    .addColumn('contrato_firmado', 'boolean', (col) => col.defaultTo(false))
    .addColumn('fecha_contrato', 'date')
    .addForeignKeyConstraint('fk_cahorro_user', ['run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // retiro
  await db.schema
    .createTable('retiro')
    .ifNotExists()
    .addColumn('id_retiro', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('monto', 'numeric', (col) => col.notNull())
    .addColumn('fecha', 'date', (col) => col.notNull())
    .addColumn('id_cuentaahorro', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint('fk_retiro_cahorro', ['id_cuentaahorro'], 'cuenta_ahorro', ['id_cuentaahorro'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // address
  await db.schema
    .createTable('address')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('type_address', 'varchar(20)', (col) => col.notNull())
    .addColumn('street', 'varchar(50)', (col) => col.notNull())
    .addColumn('number', 'smallint', (col) => col.notNull())
    .addColumn('detail', 'varchar(50)')
    .addColumn('commune_id', 'integer')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addForeignKeyConstraint('fk_address_commune', ['commune_id'], 'commune', ['id'], (cb) =>
      cb.onDelete('set null'),
    )
    .addForeignKeyConstraint('fk_address_user', ['user_run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // user_session
  await db.schema
    .createTable('user_session')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('login_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('logout_at', 'timestamp')
    .addColumn('ip_address', 'varchar(20)', (col) => col.notNull())
    .addColumn('user_agent', 'varchar(255)', (col) => col.notNull())
    .addForeignKeyConstraint('fk_usersession_user', ['user_run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // parameter
  await db.schema
    .createTable('parameter')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('minimum_days', 'integer', (col) => col.notNull())
    .addColumn('maximum_days', 'integer', (col) => col.notNull())
    .addColumn('interest_rate_base', 'numeric', (col) => col.notNull())
    .execute();

  // Seed parameter
  try {
    if (Array.isArray(parameters) && parameters.length > 0) {
      await db.insertInto('parameter').values(parameters as any).execute();
    }
  } catch (err) {
    console.warn('[migration] parameter seed insertion failed:', err);
  }
};

export const down: Migration['down'] = async (db) => {
  // reverse order
  await db.schema.dropTable('parameter').ifExists().execute();
  await db.schema.dropTable('user_session').ifExists().execute();
  await db.schema.dropTable('address').ifExists().execute();
  await db.schema.dropTable('retiro').ifExists().execute();
  await db.schema.dropTable('cuenta_ahorro').ifExists().execute();

  await db.schema.dropIndex('idx_passwordreset_expiration').ifExists().execute();
  await db.schema.dropIndex('idx_passwordreset_run').ifExists().execute();
  await db.schema.dropIndex('idx_passwordreset_token_hash').ifExists().execute();
  await db.schema.dropTable('passwordreset').ifExists().execute();

  await db.schema.dropIndex('ux_dap_internal_id').ifExists().execute();
  await db.schema.dropTable('dap_internal_ids').ifExists().execute();

  await db.schema.dropTable('dap_instructions').ifExists().execute();
  await db.schema.dropTable('dap').ifExists().execute();
  await db.schema.dropTable('client_profile').ifExists().execute();
  await db.schema.dropTable('user').ifExists().execute();

  // direccion eliminado: no hay nada que borrar aquí

  await db.schema.dropTable('commune').ifExists().execute();
  await db.schema.dropTable('region').ifExists().execute();
};