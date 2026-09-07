import { pool } from '../db/pool.js';
import { mapRow, mapRows } from '../db/rows.js';
import { HttpError } from '../middleware/errorHandler.js';

const UNIQUE_VIOLATION = '23505';

function rethrowDuplicate(error) {
  if (error.code === UNIQUE_VIOLATION) {
    throw new HttpError(409, 'An enemy template with this name already exists for this kind');
  }
  throw error;
}

export async function listAll() {
  const { rows } = await pool.query('SELECT * FROM enemy_templates ORDER BY kind ASC, name ASC');
  return mapRows(rows);
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM enemy_templates WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

export async function create({
  kind,
  name,
  level = null,
  healthMax,
  minionCount = null,
  bossTrackMax = null,
}) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO enemy_templates (kind, name, level, health_max, minion_count, boss_track_max)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [kind, name, level, healthMax, minionCount, bossTrackMax],
    );
    return mapRow(rows[0]);
  } catch (error) {
    rethrowDuplicate(error);
  }
}

const PATCHABLE_COLUMNS = {
  name: 'name',
  level: 'level',
  healthMax: 'health_max',
  minionCount: 'minion_count',
  bossTrackMax: 'boss_track_max',
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
  try {
    const { rows } = await pool.query(
      `UPDATE enemy_templates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );
    return mapRow(rows[0]);
  } catch (error) {
    rethrowDuplicate(error);
  }
}

export async function remove(id) {
  await pool.query('DELETE FROM enemy_templates WHERE id = $1', [id]);
}
