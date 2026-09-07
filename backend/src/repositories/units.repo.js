import { pool } from '../db/pool.js';
import { mapRow, mapRows } from '../db/rows.js';

export async function listByEncounter(encounterId) {
  const { rows } = await pool.query(
    'SELECT * FROM units WHERE encounter_id = $1 ORDER BY created_at ASC',
    [encounterId],
  );
  return mapRows(rows);
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM units WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

// Joins through to encounters so callers can check ownership without a second query.
export async function findByIdWithOwner(id) {
  const { rows } = await pool.query(
    `SELECT units.*, encounters.user_id AS owner_id
     FROM units JOIN encounters ON encounters.id = units.encounter_id
     WHERE units.id = $1`,
    [id],
  );
  return mapRow(rows[0]);
}

export async function create({
  encounterId,
  kind,
  name,
  level = null,
  healthMax,
  wounds = 0,
  leaderWounds = null,
  bossTrackPos = null,
  bossTrackMax = null,
}) {
  const { rows } = await pool.query(
    `INSERT INTO units (encounter_id, kind, name, level, health_max, wounds, leader_wounds, boss_track_pos, boss_track_max)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [encounterId, kind, name, level, healthMax, wounds, leaderWounds, bossTrackPos, bossTrackMax],
  );
  return mapRow(rows[0]);
}

const PATCHABLE_COLUMNS = {
  name: 'name',
  healthMax: 'health_max',
  notes: 'notes',
  showNotes: 'show_notes',
  bossTrackPos: 'boss_track_pos',
};

export async function update(id, fields) {
  const sets = [];
  const values = [];
  let i = 1;
  for (const [key, column] of Object.entries(PATCHABLE_COLUMNS)) {
    if (fields[key] !== undefined) {
      sets.push(`${column} = $${i}`);
      values.push(fields[key]);
      i += 1;
    }
  }
  sets.push('updated_at = now()');
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE units SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values,
  );
  return mapRow(rows[0]);
}

export async function updateWounds(id, wounds) {
  const { rows } = await pool.query(
    'UPDATE units SET wounds = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [wounds, id],
  );
  return mapRow(rows[0]);
}

export async function updateLeaderWounds(id, leaderWounds) {
  const { rows } = await pool.query(
    'UPDATE units SET leader_wounds = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [leaderWounds, id],
  );
  return mapRow(rows[0]);
}

export async function remove(id) {
  await pool.query('DELETE FROM units WHERE id = $1', [id]);
}
