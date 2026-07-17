const { query } = require('../config/db');

const addFavorite = async (userId, fileId) => {
  const text = `
    INSERT INTO favorites (user_id, file_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, file_id) DO NOTHING
    RETURNING *;
  `;
  const { rows } = await query(text, [userId, fileId]);
  return rows[0];
};

const removeFavorite = async (userId, fileId) => {
  const text = `
    DELETE FROM favorites
    WHERE user_id = $1 AND file_id = $2
    RETURNING *;
  `;
  const { rows } = await query(text, [userId, fileId]);
  return rows[0];
};

const getFavoritesByUser = async (userId, limit = 100, offset = 0) => {
  const text = `
    SELECT f.*, fav.created_at as favorited_at
    FROM favorites fav
    JOIN files f ON fav.file_id = f.id
    WHERE fav.user_id = $1 AND f.is_deleted = FALSE
    ORDER BY fav.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const countText = `
    SELECT COUNT(*) FROM favorites fav
    JOIN files f ON fav.file_id = f.id
    WHERE fav.user_id = $1 AND f.is_deleted = FALSE
  `;

  const [rowsRes, countRes] = await Promise.all([
    query(text, [userId, limit, offset]),
    query(countText, [userId]),
  ]);

  return {
    files: rowsRes.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

const isFavorited = async (userId, fileId) => {
  const text = `
    SELECT 1 FROM favorites
    WHERE user_id = $1 AND file_id = $2
    LIMIT 1
  `;
  const { rowCount } = await query(text, [userId, fileId]);
  return rowCount > 0;
};

const countFavoritesByUser = async (userId) => {
  const text = `
    SELECT COUNT(*) FROM favorites fav
    JOIN files f ON fav.file_id = f.id
    WHERE fav.user_id = $1 AND f.is_deleted = FALSE
  `;
  const { rows } = await query(text, [userId]);
  return parseInt(rows[0].count, 10);
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavoritesByUser,
  isFavorited,
  countFavoritesByUser,
};
