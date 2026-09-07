import 'dotenv/config';
import { runMigrations } from '../src/db/migrate.js';

// Runs once for the whole test run, before any test file — resetDb() in helpers.js no longer
// needs to (and, running per-file with fileParallelism off, safely can't) call this itself.
export default async function setup() {
  await runMigrations();
}
