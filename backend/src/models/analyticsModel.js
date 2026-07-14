const { query } = require('../config/db');

const getUserStorageStats = async (userId) => {
  const text = `
    SELECT storage_used_bytes, storage_limit_bytes
    FROM users
    WHERE id = $1
  `;
  const { rows } = await query(text, [userId]);
  return rows[0];
};

const getUserFileStatsByType = async (userId) => {
  const text = `
    SELECT mime_type, COUNT(*) as count, SUM(size_bytes) as total_size
    FROM files
    WHERE owner_id = $1
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

const getUploadsOverTime = async (userId, days = 30) => {
  const text = `
    SELECT DATE(created_at) as date, COUNT(*) as upload_count, SUM(size_bytes) as total_size
    FROM files
    WHERE owner_id = $1 AND created_at >= NOW() - $2 * INTERVAL '1 day'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;
  const { rows } = await query(text, [userId, days]);
  return rows;
};

const getAdminSystemStats = async () => {
  const usersQuery = `SELECT COUNT(*) as total_users FROM users`;
  const filesQuery = `SELECT COUNT(*) as total_files, SUM(size_bytes) as total_storage_used FROM files`;
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

module.exports = {
  getUserStorageStats,
  getUserFileStatsByType,
  getUserFolderStats,
  getUploadsOverTime,
  getAdminSystemStats,
};
