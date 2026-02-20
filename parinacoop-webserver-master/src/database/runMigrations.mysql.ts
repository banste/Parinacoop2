import * as path from 'path';
import { promises as fs } from 'fs';

import { ConfigService } from '@nestjs/config';
import { FileMigrationProvider, Kysely, Migrator } from 'kysely';
import { config } from 'dotenv';
import { cwd } from 'process';

import { EnvironmentVariables } from '@/config/environment-variables.schema';
import { dialectGenerator } from './dialect-generator';

config({
  path: path.join(
    cwd(),
    process.env.NODE_ENV === 'production'
      ? '.env.production.local'
      : '.env.development.local',
  ),
});

async function migrateToLatestMySql() {
  const configService = new ConfigService<EnvironmentVariables>();

  const db = new Kysely({
    dialect: dialectGenerator('mysql', {
      host: configService.get('DB_HOST'),
      database: configService.get('DB_NAME'),
      port: configService.get('DB_PORT'),
      user: configService.get('DB_USER'),
      password: configService.get('DB_PASSWORD'),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations-mysql'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

migrateToLatestMySql();