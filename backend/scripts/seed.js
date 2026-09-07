// One-off script that creates the single locked-down owner account directly in the DB,
// bypassing the public /api/auth/register endpoint entirely (registration stays disabled in prod).
import 'dotenv/config';
import { runMigrations } from '../src/db/migrate.js';
import { pool } from '../src/db/pool.js';
import * as usersRepo from '../src/repositories/users.repo.js';
import { hashPassword, seedSampleEncounter } from '../src/services/auth.service.js';

async function main() {
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;
  if (!username || !password) {
    throw new Error('SEED_USERNAME and SEED_PASSWORD must be set');
  }

  await runMigrations();

  const existing = await usersRepo.findByUsername(username);
  if (existing) {
    console.log(`User "${username}" already exists, skipping.`);
    return;
  }

  // The owner account this script exists to create must be an admin — the is_admin backfill
  // in migration 1700000000005 only covers rows that already existed at migration time, which
  // this one (created after migrations run) never is.
  const passwordHash = await hashPassword(password);
  const user = await usersRepo.createUser({ username, passwordHash, isAdmin: true });
  await seedSampleEncounter(user.id);
  console.log(`Created admin user "${username}" with a sample encounter.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
