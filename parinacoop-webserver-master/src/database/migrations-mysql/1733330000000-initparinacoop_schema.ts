import { Migration, sql } from 'kysely';
import { parameters } from '../seed/parameters';
import { regions_communes } from '../seed/regions';

/**
 * Migración MySQL:
 * - Evita `serial` (en MySQL puede mapear a BIGINT UNSIGNED y romper FKs con INTEGER).
 * - Usa `integer + autoIncrement()` en todas las PK autoincrementales.
 */

export const up: Migration['up'] = async (db) => {
  // REGION
  await db.schema
    .createTable('region')
    .ifNotExists()
    .addColumn('id_region', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('nombre', 'varchar(100)', (col) => col.notNull())
    .addColumn('numero_romano', 'varchar(10)', (col) => col.notNull())
    .addColumn('numero', 'integer', (col) => col.notNull())
    .addColumn('abreviacion', 'varchar(10)', (col) => col.notNull())
    .execute();

  // COMMUNE — usa region_id (lo espera la app)
  await db.schema
    .createTable('commune')
    .ifNotExists()
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('nombre', 'varchar(100)', (col) => col.notNull())
    .addColumn('codigo_postal', 'varchar(20)', (col) => col.notNull())
    .addColumn('region_id', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_commune_region',
      ['region_id'],
      'region',
      ['id_region'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // SEED REGIONS + COMMUNES (desde src/database/seed/regions.ts)
  // Nota: como no usamos `returning` (Postgres-only), recuperamos el id_region por nombre.
  for (const r of regions_communes) {
    const existingRegion = await db
      .selectFrom('region')
      .select(['id_region'])
      .where('nombre', '=', r.name)
      .executeTakeFirst();

    if (!existingRegion) {
      await db
        .insertInto('region')
        .values({
          nombre: r.name,
          numero_romano: r.roman_number,
          numero: r.number,
          abreviacion: r.abbreviation,
        })
        .execute();
    }

    const regionRow = await db
      .selectFrom('region')
      .select(['id_region'])
      .where('nombre', '=', r.name)
      .executeTakeFirstOrThrow();

    const regionId = Number((regionRow as any).id_region);

    // Insertar comunas asociadas
    for (const c of r.communes) {
      const existingCommune = await db
        .selectFrom('commune')
        .select(['id'])
        .where('nombre', '=', c.name)
        .where('region_id', '=', regionId)
        .executeTakeFirst();

      if (!existingCommune) {
        await db
          .insertInto('commune')
          .values({
            nombre: c.name,
            // en seed es number; en DB es varchar(20) (igual que tu migración original)
            codigo_postal: String(c.postal_code),
            region_id: regionId,
          })
          .execute();
      }
    }
  }

  // DIRECCION - referencia commune.id
  await db.schema
    .createTable('direccion')
    .ifNotExists()
    .addColumn('id_direccion', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('tipo_direccion', 'varchar(50)', (col) => col.notNull())
    .addColumn('numero', 'varchar(20)', (col) => col.notNull())
    .addColumn('calle', 'varchar(150)', (col) => col.notNull())
    .addColumn('detalle', 'varchar(255)', (col) => col.notNull())
    .addColumn('id_commune', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_direccion_commune',
      ['id_commune'],
      'commune',
      ['id'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // USER (autenticación) -- run como INTEGER
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

  // CLIENT_PROFILE (separada) -- FK a user.run
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

  await db.schema
    .createIndex('idx_passwordreset_token_hash')
    .on('passwordreset')
    .columns(['token_hash'])
    .execute();
  await db.schema.createIndex('idx_passwordreset_run').on('passwordreset').columns(['run']).execute();
  await db.schema
    .createIndex('idx_passwordreset_expiration')
    .on('passwordreset')
    .columns(['expiration'])
    .execute();

  // cuenta_ahorro
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
    .addForeignKeyConstraint(
      'fk_retiro_cahorro',
      ['id_cuentaahorro'],
      'cuenta_ahorro',
      ['id_cuentaahorro'],
      (cb) => cb.onDelete('cascade'),
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

  // Insertar seeds en parameter si existen
  try {
    if (Array.isArray(parameters) && parameters.length > 0) {
      await db.insertInto('parameter').values(parameters).execute();
    }
  } catch (err) {
    console.warn('[migration] parameter seed insertion failed:', err);
  }
};

export const down: Migration['down'] = async (db) => {
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
  await db.schema.dropTable('direccion').ifExists().execute();
  await db.schema.dropTable('commune').ifExists().execute();
  await db.schema.dropTable('region').ifExists().execute();
};