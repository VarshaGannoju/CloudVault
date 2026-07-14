const db = require('../config/db');

const createUser = async (name, email, password_hash) => {
  const result = await db.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [name, email, password_hash]
  );
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const updateRefreshToken = async (id, refresh_token_hash) => {
  const result = await db.query(
    'UPDATE users SET refresh_token_hash = $1 WHERE id = $2 RETURNING *',
    [refresh_token_hash, id]
  );
  return result.rows[0];
};

const verifyEmail = async (id) => {
  const result = await db.query(
    'UPDATE users SET is_email_verified = TRUE WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

const updatePassword = async (id, password_hash) => {
  const result = await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
    [password_hash, id]
  );
  return result.rows[0];
};

const updateProfile = async (id, name, avatar_url) => {
  const result = await db.query(
    'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url) WHERE id = $3 RETURNING *',
    [name, avatar_url, id]
  );
  return result.rows[0];
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateRefreshToken,
  verifyEmail,
  updatePassword,
  updateProfile,
};
