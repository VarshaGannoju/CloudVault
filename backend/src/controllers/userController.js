const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../config/db');

const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const currentUserId = req.user.id;

  if (!q || q.length < 2) {
    return res.status(200).json({ success: true, data: [] });
  }

  // Search by email prefix
  const text = `
    SELECT id, name, email 
    FROM users 
    WHERE email ILIKE $1 AND id != $2
    LIMIT 10
  `;
  const values = [`${q}%`, currentUserId];
  const { rows } = await query(text, values);

  res.status(200).json({ success: true, data: rows });
});

module.exports = {
  searchUsers
};
