import { promises as fs } from 'fs';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import {
  Migrator,
  MigrationProvider,
  Migration,
} from 'kysely';

import database from './index.js';

class ESMFileMigrationProvider implements MigrationProvider {
  constructor(private readonly migrationFolder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const files = await fs.readdir(this.migrationFolder);

    const migrations: Record<string, Migration> = {};

    for (const file of files) {
      if (!file.endsWith('.js')) continue;

      const fullPath = path.join(this.migrationFolder, file);
      const mod = await import(pathToFileURL(fullPath).href);

      const name = file.replace(/\.js$/, '');
      migrations[name] = { up: mod.up, down: mod.down };
    }

    return migrations;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function migrateToLatest() {
  const migrator = new Migrator({
    db: database,
    provider: new ESMFileMigrationProvider(path.join(__dirname, 'migrations')),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`Migration "${result.migrationName}" was executed successfully`);
    } else if (result.status === 'Error') {
      console.error(`Failed to execute migration "${result.migrationName}"`);
    }
  });

  if (error) {
    throw new Error(`Migration failed: ${error}`);
  }
}
