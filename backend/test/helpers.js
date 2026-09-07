import 'dotenv/config';
import bcrypt from 'bcrypt';

process.env.SESSION_SECRET ||= 'test-secret';
process.env.COOKIE_SECURE ||= 'false';
import { pool } from '../src/db/pool.js';
import { createApp } from '../src/app.js';
import * as usersRepo from '../src/repositories/users.repo.js';

// Migrations run once in test/globalSetup.js, before any test file — not here, since
// fileParallelism is off specifically so files don't race each other's resets/migrations.
export async function resetDb() {
  await pool.query('TRUNCATE TABLE minions, units, encounters, users RESTART IDENTITY CASCADE');
  // enemy_templates is intentionally NOT truncated here: it's global reference data seeded once
  // by migration 1700000000007, not per-test state — wiping it would be permanent (migrations
  // don't re-run once applied). Tests that touch it clean up their own rows instead.
}

export function buildApp() {
  return createApp();
}

export async function createTestUser(username = 'tester', password = 'correct-horse', isAdmin = false) {
  const passwordHash = await bcrypt.hash(password, 4);
  await usersRepo.createUser({ username, passwordHash, isAdmin });
  return { username, password };
}

export async function closeDb() {
  await pool.end();
}
