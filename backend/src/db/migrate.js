import { fileURLToPath } from 'node:url';
import { runner } from 'node-pg-migrate';

const migrationsDir = fileURLToPath(new URL('../../migrations', import.meta.url));

export function runMigrations() {
  return runner({
    databaseUrl: process.env.DATABASE_URL,
    dir: migrationsDir,
    migrationsTable: 'pgmigrations',
    direction: 'up',
    log: () => {},
  });
}
