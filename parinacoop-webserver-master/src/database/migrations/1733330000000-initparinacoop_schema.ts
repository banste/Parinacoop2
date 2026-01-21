import { Migration, sql } from 'kysely';
import { parameters } from '../seed/parameters';

/**
 * Migración única y corregida:
 * - `commune.region_id` en vez de `id_region` para que el app use region_id.
 * - Se añade soporte para passwordreset con token_hash + used_at y índices.
 *
 * Nota: Si tienes datos en una tabla `comuna` previa, dime y preparo un script
 * para copiar (mapear) filas desde `comuna` -> `commune`.
 */

export const up: Migration['up'] = async (db) => {
  // REGION
  await db.schema
    .createTable('region')
    .ifNotExists()
    .addColumn('id_region', 'serial', (col) => col.primaryKey())
    .addColumn('nombre', 'varchar(100)', (col) => col.notNull())
    .addColumn('numero_romano', 'varchar(10)', (col) => col.notNull())
    .addColumn('numero', 'integer', (col) => col.notNull())
    .addColumn('abreviacion', 'varchar(10)', (col) => col.notNull())
    .execute();

  // COMMUNE (inglés) — usa region_id (lo espera la app)
  await db.schema
    .createTable('commune')
    .ifNotExists()
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('nombre', 'varchar(100)', (col) => col.notNull())
    .addColumn('codigo_postal', 'varchar(20)', (col) => col.notNull())
    .addColumn('region_id', 'integer') // <- nombre esperado por la aplicación
    .addForeignKeyConstraint(
      'fk_commune_region',
      ['region_id'],
      'region',
      ['id_region'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // DIRECCION (español) - referencia commune.id
  await db.schema
    .createTable('direccion')
    .ifNotExists()
    .addColumn('id_direccion', 'serial', (col) => col.primaryKey())
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
    .addColumn('id', 'serial', (col) => col.primaryKey())
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
    .addColumn('id', 'serial', (col) => col.primaryKey())
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
    .addColumn('id_dap_instructions', 'serial', (col) => col.primaryKey())
    .addColumn('bank_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('account_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('account_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('account_holder_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('account_holder_rut', 'varchar(15)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`))
    .execute();

  // PASSWORDRESET (CAMBIAR_PASSWORD) - tabla para tokens de recuperación
  await db.schema
    .createTable('passwordreset')
    .ifNotExists()
    .addColumn('id_passwordreset', 'serial', (col) => col.primaryKey())
    // token almacena el token original solo si lo quieres; preferible usar token_hash
    .addColumn('token', 'varchar(255)', (col) => col.notNull())
    // hash del token (sha256 hex) para búsquedas seguras
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull())
    .addColumn('expiration', 'timestamp', (col) => col.notNull())
    .addColumn('fecha_creacion', 'timestamp', (col) => col.defaultTo(sql`now()`))
    // marca cuando el token fue utilizado (null = no usado)
    .addColumn('used_at', 'timestamp') // nullable por defecto si no se usa .notNull()
    .addColumn('run', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint('fk_password_user', ['run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // Índices para passwordreset (búsqueda por hash / run / expiration)
  await db.schema
    .createIndex('idx_passwordreset_token_hash')
    .on('passwordreset')
    .columns(['token_hash'])
    .execute();

  await db.schema
    .createIndex('idx_passwordreset_run')
    .on('passwordreset')
    .columns(['run'])
    .execute();

  await db.schema
    .createIndex('idx_passwordreset_expiration')
    .on('passwordreset')
    .columns(['expiration'])
    .execute();

  // CUENTA_AHORRO
  await db.schema
    .createTable('cuenta_ahorro')
    .ifNotExists()
    .addColumn('id_cuentaahorro', 'serial', (col) => col.primaryKey())
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

  // RETIRO
  await db.schema
    .createTable('retiro')
    .ifNotExists()
    .addColumn('id_retiro', 'serial', (col) => col.primaryKey())
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

  // ADDRESS
  await db.schema
    .createTable('address')
    .ifNotExists()
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('type_address', 'varchar(20)', (col) => col.notNull())
    .addColumn('street', 'varchar(50)', (col) => col.notNull())
    .addColumn('number', 'smallint', (col) => col.notNull())
    .addColumn('detail', 'varchar(50)')
    .addColumn('commune_id', 'integer')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addForeignKeyConstraint(
      'fk_address_commune',
      ['commune_id'],
      'commune',
      ['id'],
      (cb) => cb.onDelete('set null'),
    )
    .addForeignKeyConstraint('fk_address_user', ['user_run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // USER_SESSION
  await db.schema
    .createTable('user_session')
    .ifNotExists()
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_run', 'integer', (col) => col.notNull())
    .addColumn('login_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('logout_at', 'timestamp')
    .addColumn('ip_address', 'varchar(20)', (col) => col.notNull())
    .addColumn('user_agent', 'varchar(255)', (col) => col.notNull())
    .addForeignKeyConstraint('fk_usersession_user', ['user_run'], 'user', ['run'], (cb) =>
      cb.onDelete('cascade'),
    )
    .execute();

  // PARAMETER
  await db.schema
    .createTable('parameter')
    .ifNotExists()
    .addColumn('id', 'serial', (col) => col.primaryKey())
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
  // eliminación en orden inverso para no romper FK
  await db.schema.dropTable('parameter').ifExists().execute();
  await db.schema.dropTable('user_session').ifExists().execute();
  await db.schema.dropTable('address').ifExists().execute();
  await db.schema.dropTable('retiro').ifExists().execute();
  await db.schema.dropTable('cuenta_ahorro').ifExists().execute();

  // eliminar índices relacionados con passwordreset antes de borrar la tabla
  await db.schema.dropIndex('idx_passwordreset_expiration').ifExists().execute();
  await db.schema.dropIndex('idx_passwordreset_run').ifExists().execute();
  await db.schema.dropIndex('idx_passwordreset_token_hash').ifExists().execute();

  await db.schema.dropTable('passwordreset').ifExists().execute();

  await db.schema.dropTable('dap_instructions').ifExists().execute();
  await db.schema.dropTable('dap').ifExists().execute();
  await db.schema.dropTable('client_profile').ifExists().execute();
  await db.schema.dropTable('user').ifExists().execute();
  await db.schema.dropTable('direccion').ifExists().execute();
  await db.schema.dropTable('commune').ifExists().execute();
  await db.schema.dropTable('region').ifExists().execute();
};