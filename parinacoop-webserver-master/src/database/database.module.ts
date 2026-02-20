import { Global, Module } from '@nestjs/common';
import { ConfigurableDatabaseModule, DATABASE_OPTIONS } from './database.module-definition';
import { Database } from './database';
import { DatabaseOptions } from './databaseOptions';
import { dialectGenerator } from './dialect-generator';

type DatabaseProvider = 'mysql' | 'postgres';

@Global()
@Module({
  exports: [Database],
  providers: [
    {
      provide: Database,
      inject: [DATABASE_OPTIONS],
      useFactory: (databaseOptions: DatabaseOptions) => {
        const provider = (process.env.DB_PROVIDER as DatabaseProvider) ?? 'postgres';

        const dialect = dialectGenerator(provider, {
          host: databaseOptions.host,
          database: databaseOptions.database,
          port: databaseOptions.port,
          user: databaseOptions.user,
          password: databaseOptions.password,
        });

        return new Database({ dialect });
      },
    },
  ],
})
export class DatabaseModule extends ConfigurableDatabaseModule {}