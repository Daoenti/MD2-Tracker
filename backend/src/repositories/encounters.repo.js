import { pool } from '../db/pool.js';
import { mapRow, mapRows } from '../db/rows.js';

export async function listByUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM encounters WHERE user_id = $1 ORDER BY created_at ASC',
    [userId],
  );
  return mapRows(rows);
}

export async function findByIdAndUser(id, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM encounters WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  return mapRow(rows[0]);
}

export async function create({ userId, name, heroCount = 4, darknessSide = 'A', darknessPos = 1, isSample = false }) {
  const { rows } = await pool.query(
    `INSERT INTO encounters (user_id, name, hero_count, darkness_side, darkness_pos, is_sample)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, name, heroCount, darknessSide, darknessPos, isSample],
  );
  return mapRow(rows[0]);
}

const PATCHABLE_COLUMNS = {
  name: 'name',
  heroCount: 'hero_count',
  darknessSide: 'darkness_side',
  darknessPos: 'darkness_pos',
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
    `UPDATE encounters SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    values,
  );
  return mapRow(rows[0]);
}

export async function remove(id) {
  await pool.query('DELETE FROM encounters WHERE id = $1', [id]);
}
