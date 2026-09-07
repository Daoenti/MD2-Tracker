import 'dotenv/config';
import bcrypt from 'bcrypt';

process.env.SESSION_SECRET ||= 'test-secret';
process.env.COOKIE_SECURE ||= 'false';
import { pool } from '../src/db/pool.js';
import { runMigrations } from '../src/db/migrate.js';
import { createApp } from '../src/app.js';
import * as usersRepo from '../src/repositories/users.repo.js';

export async function resetDb() {
  await runMigrations();
  await pool.query('TRUNCATE TABLE minions, units, encounters, users RESTART IDENTITY CASCADE');
}

export function buildApp() {
  return createApp();
}

export async function createTestUser(username = 'tester', password = 'correct-horse') {
  const passwordHash = await bcrypt.hash(password, 4);
  await usersRepo.createUser({ username, passwordHash });
  return { username, password };
}

export async function closeDb() {
  await pool.end();
}
