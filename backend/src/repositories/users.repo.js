import { pool } from '../db/pool.js';
import { mapRow } from '../db/rows.js';

export async function findByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return mapRow(rows[0]);
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

export async function createUser({ username, passwordHash }) {
  const { rows } = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
    [username, passwordHash],
  );
  return mapRow(rows[0]);
}
