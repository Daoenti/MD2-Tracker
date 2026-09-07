import { pool } from '../db/pool.js';
import { mapRow, mapRows } from '../db/rows.js';

export async function listByUnit(unitId) {
  const { rows } = await pool.query(
    'SELECT * FROM minions WHERE unit_id = $1 ORDER BY created_at ASC',
    [unitId],
  );
  return mapRows(rows);
}

// Joins through unit + encounter so callers can check ownership without extra queries.
export async function findByIdWithOwner(id) {
  const { rows } = await pool.query(
    `SELECT minions.*, units.encounter_id AS encounter_id, units.health_max AS unit_health_max,
            encounters.user_id AS owner_id
     FROM minions
     JOIN units ON units.id = minions.unit_id
     JOIN encounters ON encounters.id = units.encounter_id
     WHERE minions.id = $1`,
    [id],
  );
  return mapRow(rows[0]);
}

export async function create(unitId, wounds = 0) {
  const { rows } = await pool.query(
    'INSERT INTO minions (unit_id, wounds) VALUES ($1, $2) RETURNING *',
    [unitId, wounds],
  );
  return mapRow(rows[0]);
}

export async function updateWounds(id, wounds) {
  const { rows } = await pool.query(
    'UPDATE minions SET wounds = $1 WHERE id = $2 RETURNING *',
    [wounds, id],
  );
  return mapRow(rows[0]);
}

export async function remove(id) {
  await pool.query('DELETE FROM minions WHERE id = $1', [id]);
}
