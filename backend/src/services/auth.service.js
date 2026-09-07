import bcrypt from 'bcrypt';
import * as usersRepo from '../repositories/users.repo.js';
import * as encountersRepo from '../repositories/encounters.repo.js';
import * as unitsRepo from '../repositories/units.repo.js';
import * as minionsRepo from '../repositories/minions.repo.js';
import { HttpError } from '../middleware/errorHandler.js';

const BCRYPT_ROUNDS = 12;

export async function registerUser({ username, password }) {
  const existing = await usersRepo.findByUsername(username);
  if (existing) {
    throw new HttpError(409, 'Username already taken');
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await usersRepo.createUser({ username, passwordHash });
  await seedSampleEncounter(user.id);
  return user;
}

export async function verifyLogin({ username, password }) {
  const user = await usersRepo.findByUsername(username);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}

// Mirrors the original client's defaultState() sample data, ported to a real encounter row.
export async function seedSampleEncounter(userId) {
  const encounter = await encountersRepo.create({
    userId,
    name: 'Sample Encounter',
    heroCount: 4,
    darknessSide: 'A',
    darknessPos: 3,
    isSample: true,
  });

  const mob = await unitsRepo.create({
    encounterId: encounter.id,
    kind: 'mob',
    name: 'Undead',
    level: '1-2',
    healthMax: 4,
    leaderWounds: 0,
  });
  for (const wounds of [0, 0, 1, 4]) {
    await minionsRepo.create(mob.id, wounds);
  }

  await unitsRepo.create({
    encounterId: encounter.id,
    kind: 'boss',
    name: 'Michael',
    healthMax: 20,
    wounds: 6,
    bossTrackPos: 2,
    bossTrackMax: 8,
  });

  return encounter;
}
