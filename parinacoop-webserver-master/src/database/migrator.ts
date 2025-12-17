import { writeFile } from 'fs/promises';
import { join } from 'path';
import { createInterface } from 'node:readline/promises';
async function makeMigration() {
  const migrationsPath = './migrations';

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const nameEntry = await rl.question('Enter migration name: ');

  const migrationName = nameEntry
    ? nameEntry.replaceAll(' ', '_')
    : 'migration';

  const now = Date.now();
  const path = join(__dirname, migrationsPath, `${now}_${migrationName}.ts`);

  await writeFile(
    path,
    `import { Migration, sql } from 'kysely';

export const up: Migration['up'] = async (db) => {
  
};

export const down: Migration['down'] = async (db) => {
  
};

`,
  );
  console.log('Migration created at:', path);

  rl.close();
}

makeMigration();
