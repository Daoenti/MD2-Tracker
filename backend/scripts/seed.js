// One-off script that creates the single locked-down owner account directly in the DB,
// bypassing the public /api/auth/register endpoint entirely (registration stays disabled in prod).
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { runMigrations } from '../src/db/migrate.js';
import { pool } from '../src/db/pool.js';
import * as usersRepo from '../src/repositories/users.repo.js';
import { seedSampleEncounter } from '../src/services/auth.service.js';

const BCRYPT_ROUNDS = 12;

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

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await usersRepo.createUser({ username, passwordHash });
  await seedSampleEncounter(user.id);
  console.log(`Created user "${username}" with a sample encounter.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
