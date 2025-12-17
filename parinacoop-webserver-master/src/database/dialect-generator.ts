import { Dialect, MysqlDialect, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DatabaseOptions } from './databaseOptions';
import { createPool } from 'mysql2';

type DatabaseProvider = 'mysql' | 'postgres';

export const dialectGenerator = (
  databaseProvider: DatabaseProvider,
  options: DatabaseOptions,
): Dialect => {
  switch (databaseProvider) {
    case 'postgres':
      return new PostgresDialect({
        pool: new Pool({
          host: options.host,
          database: options.database,
          port: options.port,
          user: options.user,
          password: options.password,
          max: 10,
        }),
      });

    case 'mysql':
      return new MysqlDialect({
        pool: createPool({
          database: options.database,
          host: options.host,
          user: options.user,
          port: options.port,
          password: options.password,
          connectionLimit: 10,
        }),
      });

    default:
      throw new Error('Unsupported database provider');
  }
};
