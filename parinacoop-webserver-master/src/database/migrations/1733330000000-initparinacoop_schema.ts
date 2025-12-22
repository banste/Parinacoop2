import { Migration } from 'kysely';

export const up: Migration['up'] = async (db) => {
  // REGION
  await db.schema
    .createTable('region')
    .addColumn('id_region', 'serial', (col) => col.primaryKey())
    .addColumn('nombre', 'varchar(100)', (col) => col.notNull())
    .addColumn('numero_romano', 'varchar(10)', (col) => col.notNull())
    .addColumn('numero', 'integer', (col) => col.notNull())
    .addColumn('abreviacion', 'varchar(10)', (col) => col.notNull())
    .execute();

  // COMUNA
  await db.schema
    .createTable('comuna')
    .addColumn('id_comuna', 'serial', (col) => col.primaryKey())
    .addColumn('nombre', 'varchar(100)', (col) => col.notNull())
    .addColumn('codigo_postal', 'varchar(20)', (col) => col.notNull())
    .addColumn('id_region', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_comuna_region',
      ['id_region'],
      'region',
      ['id_region'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // DIRECCION
  await db.schema
    .createTable('direccion')
    .addColumn('id_direccion', 'serial', (col) => col.primaryKey())
    .addColumn('tipo_direccion', 'varchar(50)', (col) => col.notNull())
    .addColumn('numero', 'varchar(20)', (col) => col.notNull())
    .addColumn('calle', 'varchar(150)', (col) => col.notNull())
    .addColumn('detalle', 'varchar(255)', (col) => col.notNull())
    .addColumn('id_comuna', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_direccion_comuna',
      ['id_comuna'],
      'comuna',
      ['id_comuna'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // USUARIO
  await db.schema
    .createTable('usuario')
    // run ahora es texto, soporta K, puntos, guion, etc.
    .addColumn('run', 'varchar(12)', (col) => col.primaryKey())
    .addColumn('primer_apellido', 'varchar(20)', (col) => col.notNull())
    .addColumn('segundo_apellido', 'varchar(20)', (col) => col.notNull())
    .addColumn('celular', 'varchar(20)', (col) => col.notNull())
    .addColumn('contrasena', 'varchar(255)', (col) => col.notNull())
    .addColumn('fecha_creacion', 'date', (col) => col.notNull())
    .addColumn('fecha_actualizacion', 'date', (col) => col.notNull())
    .addColumn('nombres', 'varchar(150)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('id_direccion', 'integer', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_usuario_direccion',
      ['id_direccion'],
      'direccion',
      ['id_direccion'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // DAP
  await db.schema
    .createTable('dap')
    .addColumn('id_dap', 'serial', (col) => col.primaryKey())
    .addColumn('tipo', 'varchar(50)', (col) => col.notNull())
    .addColumn('tipo_moneda', 'varchar(20)', (col) => col.notNull())
    .addColumn('estado', 'varchar(50)', (col) => col.notNull())
    .addColumn('dias', 'integer', (col) => col.notNull())
    .addColumn('fecha_inicial', 'date', (col) => col.notNull())
    .addColumn('monto_inicial', 'numeric(12, 2)', (col) => col.notNull())
    .addColumn('fecha_vencimiento', 'date', (col) => col.notNull())
    .addColumn('monto_final', 'numeric(12, 2)', (col) => col.notNull())
    .addColumn('tasa_interes', 'numeric(5, 2)', (col) => col.notNull())
    // FK también como texto
    .addColumn('run', 'varchar(12)', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_dap_usuario',
      ['run'],
      'usuario',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // ✅ DAP_INSTRUCTIONS (config admin para cuenta destino + instructivo)
  await db.schema
    .createTable('dap_instructions')
    .addColumn('id_dap_instructions', 'serial', (col) => col.primaryKey())
    .addColumn('bank_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('account_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('account_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('account_holder_name', 'varchar(100)', (col) => col.notNull())
    // si quieres permitir "76.123.456-7", cambia a varchar(15)
    .addColumn('account_holder_rut', 'varchar(12)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)')
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(db.fn('current_timestamp')),
    )
    .execute();

  // CAMBIAR_PASSWORD
  await db.schema
    .createTable('cambiar_password')
    .addColumn('id_passwordreset', 'serial', (col) => col.primaryKey())
    .addColumn('token', 'varchar(255)', (col) => col.notNull())
    .addColumn('expiration', 'date', (col) => col.notNull())
    .addColumn('fecha_creacion', 'date', (col) => col.notNull())
    // también texto
    .addColumn('run', 'varchar(12)', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_password_usuario',
      ['run'],
      'usuario',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // CUENTA_AHORRO
  await db.schema
    .createTable('cuenta_ahorro')
    .addColumn('id_cuentaahorro', 'serial', (col) => col.primaryKey())
    .addColumn('monto_inicial', 'numeric(12, 2)', (col) => col.notNull())
    .addColumn('tipo_moneda', 'varchar(20)', (col) => col.notNull())
    .addColumn('tasa_de_interes', 'numeric(5, 2)', (col) => col.notNull())
    .addColumn('fecha_inicial', 'date', (col) => col.notNull())
    .addColumn('fecha_cierre', 'date')
    // FK texto
    .addColumn('run', 'varchar(12)', (col) => col.notNull())
    .addColumn('contrato_url', 'varchar(255)')
    .addColumn('contrato_hash', 'varchar(128)')
    .addColumn('contrato_firmado', 'boolean', (col) => col.defaultTo(false))
    .addColumn('fecha_contrato', 'date')
    .addForeignKeyConstraint(
      'fk_cahorro_usuario',
      ['run'],
      'usuario',
      ['run'],
      (cb) => cb.onDelete('cascade'),
    )
    .execute();

  // RETIRO
  await db.schema
    .createTable('retiro')
    .addColumn('id_retiro', 'serial', (col) => col.primaryKey())
    .addColumn('monto', 'numeric(12, 2)', (col) => col.notNull())
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
};

export const down: Migration['down'] = async (db) => {
  await db.schema.dropTable('retiro').execute();
  await db.schema.dropTable('cuenta_ahorro').execute();
  await db.schema.dropTable('cambiar_password').execute();
  await db.schema.dropTable('dap_instructions').execute(); // ✅ nuevo
  await db.schema.dropTable('dap').execute();
  await db.schema.dropTable('usuario').execute();
  await db.schema.dropTable('direccion').execute();
  await db.schema.dropTable('comuna').execute();
  await db.schema.dropTable('region').execute();
};
