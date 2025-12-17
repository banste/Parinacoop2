import { Global, Module } from '@nestjs/common';
import {
  ConfigurableDatabaseModule,
  DATABASE_OPTIONS,
} from './database.module-definition';
import { Database } from './database';
import { DatabaseOptions } from './databaseOptions';
import { dialectGenerator } from './dialect-generator';

@Global()
@Module({
  exports: [Database],
  providers: [
    {
      provide: Database,
      inject: [DATABASE_OPTIONS],
      useFactory: (databaseOptions: DatabaseOptions) => {
        const dialect = dialectGenerator('postgres', {
          host: databaseOptions.host,
          database: databaseOptions.database,
          port: databaseOptions.port,
          user: databaseOptions.user,
          password: databaseOptions.password,
        });

        return new Database({
          dialect,
        });
      },
    },
  ],
})
export class DatabaseModule extends ConfigurableDatabaseModule {}
