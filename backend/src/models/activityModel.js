const { query } = require('../config/db');

const logActivity = async (userId, action, targetType, targetId, metadata = {}) => {
  const text = `
    INSERT INTO activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [userId, action, targetType, targetId, metadata];
  const { rows } = await query(text, values);
  return rows[0];
};

const getRecentActivities = async (userId, limit = 10, offset = 0) => {
  const text = `
    SELECT * FROM activity_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const countText = `SELECT COUNT(*) FROM activity_logs WHERE user_id = $1`;
  
  const [rowsRes, countRes] = await Promise.all([
    query(text, [userId, limit, offset]),
    query(countText, [userId])
  ]);

  return {
    activities: rowsRes.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

const getRecentUploads = async (userId, limit = 5) => {
  const text = `
    SELECT f.* 
    FROM files f
    WHERE f.owner_id = $1
    ORDER BY f.created_at DESC
    LIMIT $2
  `;
  const { rows } = await query(text, [userId, limit]);
  return rows;
};

const getRecentDownloads = async (userId, limit = 5) => {
  // Downloads tracked via activity logs where action = 'file.download'
  const text = `
    SELECT al.id as log_id, al.created_at as downloaded_at, f.* 
    FROM activity_logs al
    JOIN files f ON al.target_id = f.id
    WHERE al.user_id = $1 AND al.action = 'file.download'
    ORDER BY al.created_at DESC
    LIMIT $2
  `;
  const { rows } = await query(text, [userId, limit]);
  return rows;
};

module.exports = {
  logActivity,
  getRecentActivities,
  getRecentUploads,
  getRecentDownloads,
};
