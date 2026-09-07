import { pool } from '../db/pool.js';
import { mapRow, mapRows } from '../db/rows.js';

export async function findByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return mapRow(rows[0]);
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

export async function listAll() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
  return mapRows(rows);
}

export async function createUser({ username, passwordHash, isAdmin = false }) {
  const { rows } = await pool.query(
    'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING *',
    [username, passwordHash, isAdmin],
  );
  return mapRow(rows[0]);
}

export async function updatePassword(id, passwordHash) {
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
    [passwordHash, id],
  );
  return mapRow(rows[0]);
}

export async function updateIsAdmin(id, isAdmin) {
  const { rows } = await pool.query(
    'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING *',
    [isAdmin, id],
  );
  return mapRow(rows[0]);
}

export async function remove(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}
