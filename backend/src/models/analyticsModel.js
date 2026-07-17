const { query } = require('../config/db');

const getUserStorageStats = async (userId) => {
  const text = `
    SELECT
      COALESCE(SUM(size_bytes), 0) AS storage_used_bytes
    FROM files
    WHERE owner_id = $1
      AND is_deleted = FALSE
  `;

  const { rows } = await query(text, [userId]);

  return {
    storage_used_bytes: rows[0].storage_used_bytes,
    storage_limit_bytes: 5368709120// 5 GB
  };
};

const getUserFileStatsByType = async (userId) => {
  const text = `
    SELECT mime_type, COUNT(*) as count, SUM(size_bytes) as total_size
    FROM files
    WHERE owner_id = $1 AND is_deleted = FALSE
    GROUP BY mime_type
  `;
  const { rows } = await query(text, [userId]);
  return rows;
};

const getUserFolderStats = async (userId) => {
  const text = `
    SELECT COUNT(*) as folder_count
    FROM folders
    WHERE owner_id = $1
  `;
  const { rows } = await query(text, [userId]);
  return rows[0];
};

const getUploadsOverTime = async (userId) => {
  // Aggregate uploads by calendar week (weeks start on Monday). Returns all historical weeks
  // from the user's first upload up to the current week, with zero-filled gaps.
  const text = `
    SELECT DATE_TRUNC('week', created_at)::date as week_start,
           COUNT(*) as upload_count,
           SUM(size_bytes) as total_size
    FROM files
    WHERE owner_id = $1 AND is_deleted = FALSE
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week_start ASC
  `;
  const { rows } = await query(text, [userId]);

  if (rows.length === 0) return [];

  const startDate = new Date(rows[0].week_start);
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const countsByWeek = new Map(rows.map(r => [r.week_start.toISOString().split('T')[0], parseInt(r.upload_count, 10)]));

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const filled = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    const weekStart = new Date(d);
    const weekEnd = addDays(weekStart, 6);
    const weekKey = weekStart.toISOString().split('T')[0];
    filled.push({
      week_start: weekKey,
      week_end: weekEnd.toISOString().split('T')[0],
      upload_count: countsByWeek.get(weekKey) || 0,
    });
  }

  return filled;
};

const getAdminSystemStats = async () => {
  const usersQuery = `SELECT COUNT(*) as total_users FROM users`;
  const filesQuery = `SELECT COUNT(*) as total_files, SUM(size_bytes) as total_storage_used FROM files WHERE is_deleted = FALSE`;
  const foldersQuery = `SELECT COUNT(*) as total_folders FROM folders`;
  
  const [usersRes, filesRes, foldersRes] = await Promise.all([
    query(usersQuery),
    query(filesQuery),
    query(foldersQuery)
  ]);

  return {
    totalUsers: parseInt(usersRes.rows[0].total_users, 10),
    totalFiles: parseInt(filesRes.rows[0].total_files, 10),
    totalStorageUsed: parseInt(filesRes.rows[0].total_storage_used || 0, 10),
    totalFolders: parseInt(foldersRes.rows[0].total_folders, 10),
  };
};

const countSharedFiles = async (userId) => {
  const text = `
    SELECT COUNT(DISTINCT sf.file_id) as shared_count
    FROM shared_files sf
    JOIN files f ON sf.file_id = f.id
    WHERE sf.shared_by = $1 AND f.is_deleted = FALSE
  `;
  const { rows } = await query(text, [userId]);
  return parseInt(rows[0].shared_count, 10);
};

const countStarredFiles = async (userId) => {
  const text = `
    SELECT COUNT(*) as starred_count
    FROM favorites fav
    JOIN files f ON fav.file_id = f.id
    WHERE fav.user_id = $1 AND f.is_deleted = FALSE
  `;
  const { rows } = await query(text, [userId]);
  return parseInt(rows[0].starred_count, 10);
};

const getRecentActivity = async (userId, limit = 5) => {
  const text = `
    SELECT al.*, f.original_name as target_name
    FROM activity_logs al
    LEFT JOIN files f ON al.target_type = 'file' AND al.target_id = f.id
    WHERE al.user_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2
  `;
  const { rows } = await query(text, [userId, limit]);
  return rows;
};

module.exports = {
  getUserStorageStats,
  getUserFileStatsByType,
  getUserFolderStats,
  getUploadsOverTime,
  getAdminSystemStats,
  countSharedFiles,
  countStarredFiles,
  getRecentActivity,
};
