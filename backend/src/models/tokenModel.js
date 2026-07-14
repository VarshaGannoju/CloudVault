const db = require('../config/db');

// --- Password Reset Tokens ---
const createPasswordResetToken = async (user_id, token_hash, expires_at) => {
  const result = await db.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [user_id, token_hash, expires_at]
  );
  return result.rows[0];
};

const findPasswordResetToken = async (token_hash) => {
  const result = await db.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()',
    [token_hash]
  );
  return result.rows[0];
};

const markPasswordResetTokenAsUsed = async (id) => {
  await db.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [id]);
};

// --- Email Verification Tokens ---
const createEmailVerificationToken = async (user_id, token_hash, expires_at) => {
  const result = await db.query(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [user_id, token_hash, expires_at]
  );
  return result.rows[0];
};

const findEmailVerificationToken = async (token_hash) => {
  const result = await db.query(
    'SELECT * FROM email_verification_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()',
    [token_hash]
  );
  return result.rows[0];
};

const markEmailVerificationTokenAsUsed = async (id) => {
  await db.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1', [id]);
};

module.exports = {
  createPasswordResetToken,
  findPasswordResetToken,
  markPasswordResetTokenAsUsed,
  createEmailVerificationToken,
  findEmailVerificationToken,
  markEmailVerificationTokenAsUsed,
};
