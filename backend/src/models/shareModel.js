const { query } = require('../config/db');

const createFileShare = async (data) => {
  const text = `
    INSERT INTO shared_files (file_id, shared_by, shared_with, permission, public_token, password_hash, allow_download, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    data.file_id,
    data.shared_by,
    data.shared_with || null,
    data.permission || 'read',
    data.public_token || null,
    data.password_hash || null,
    data.allow_download !== undefined ? data.allow_download : true,
    data.expires_at || null,
  ];
  const { rows } = await query(text, values);
  return rows[0];
};

const createFolderShare = async (data) => {
  const text = `
    INSERT INTO shared_folders (folder_id, shared_by, shared_with, permission, public_token, password_hash, allow_download, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    data.folder_id,
    data.shared_by,
    data.shared_with || null,
    data.permission || 'read',
    data.public_token || null,
    data.password_hash || null,
    data.allow_download !== undefined ? data.allow_download : true,
    data.expires_at || null,
  ];
  const { rows } = await query(text, values);
  return rows[0];
};

const getFileShareById = async (id) => {
  const text = `SELECT sf.*, f.original_name, f.cloudinary_url, f.mime_type, f.size_bytes FROM shared_files sf JOIN files f ON sf.file_id = f.id WHERE sf.id = $1`;
  const { rows } = await query(text, [id]);
  return rows[0];
};

const getFolderShareById = async (id) => {
  const text = `SELECT sf.*, f.name FROM shared_folders sf JOIN folders f ON sf.folder_id = f.id WHERE sf.id = $1`;
  const { rows } = await query(text, [id]);
  return rows[0];
};

const getFileShareByToken = async (token) => {
  const text = `SELECT sf.*, f.original_name, f.cloudinary_url, f.mime_type, f.size_bytes FROM shared_files sf JOIN files f ON sf.file_id = f.id WHERE sf.public_token = $1`;
  const { rows } = await query(text, [token]);
  return rows[0];
};

const getFolderShareByToken = async (token) => {
  const text = `SELECT sf.*, f.name FROM shared_folders sf JOIN folders f ON sf.folder_id = f.id WHERE sf.public_token = $1`;
  const { rows } = await query(text, [token]);
  return rows[0];
};

const incrementFileShareView = async (id) => {
  const text = `UPDATE shared_files SET views = views + 1 WHERE id = $1`;
  await query(text, [id]);
};

const incrementFolderShareView = async (id) => {
  const text = `UPDATE shared_folders SET views = views + 1 WHERE id = $1`;
  await query(text, [id]);
};

const deleteFileShare = async (id, ownerId) => {
  // Can be deleted by share creator or file owner
  const text = `
    DELETE FROM shared_files sf 
    USING files f
    WHERE sf.file_id = f.id AND sf.id = $1 AND (sf.shared_by = $2 OR f.owner_id = $2)
  `;
  const { rowCount } = await query(text, [id, ownerId]);
  return rowCount > 0;
};

const deleteFolderShare = async (id, ownerId) => {
  const text = `
    DELETE FROM shared_folders sf 
    USING folders f
    WHERE sf.folder_id = f.id AND sf.id = $1 AND (sf.shared_by = $2 OR f.owner_id = $2)
  `;
  const { rowCount } = await query(text, [id, ownerId]);
  return rowCount > 0;
};

const getSharesByUser = async (userId) => {
  const filesQuery = `
    SELECT sf.id, sf.file_id as target_id, 'file' as type, f.original_name as target_name, 
           sf.shared_with, sf.public_token, sf.permission, sf.expires_at, sf.created_at, sf.views, u.name as shared_with_name, u.email as shared_with_email
    FROM shared_files sf
    JOIN files f ON sf.file_id = f.id
    LEFT JOIN users u ON sf.shared_with = u.id
    WHERE sf.shared_by = $1
  `;
  const foldersQuery = `
    SELECT sf.id, sf.folder_id as target_id, 'folder' as type, f.name as target_name, 
           sf.shared_with, sf.public_token, sf.permission, sf.expires_at, sf.created_at, sf.views, u.name as shared_with_name, u.email as shared_with_email
    FROM shared_folders sf
    JOIN folders f ON sf.folder_id = f.id
    LEFT JOIN users u ON sf.shared_with = u.id
    WHERE sf.shared_by = $1
  `;
  const [filesRes, foldersRes] = await Promise.all([
    query(filesQuery, [userId]),
    query(foldersQuery, [userId])
  ]);
  
  return [...filesRes.rows, ...foldersRes.rows].sort((a, b) => b.created_at - a.created_at);
};

const getSharedWithUser = async (userId) => {
  // Get private shares where shared_with = userId
  const filesQuery = `
    SELECT sf.id, sf.file_id as target_id, 'file' as type, f.original_name as target_name, 
           sf.shared_by, sf.permission, sf.expires_at, sf.created_at, u.name as shared_by_name, u.email as shared_by_email
    FROM shared_files sf
    JOIN files f ON sf.file_id = f.id
    JOIN users u ON sf.shared_by = u.id
    WHERE sf.shared_with = $1
      AND (sf.expires_at IS NULL OR sf.expires_at > NOW())
  `;
  const foldersQuery = `
    SELECT sf.id, sf.folder_id as target_id, 'folder' as type, f.name as target_name, 
           sf.shared_by, sf.permission, sf.expires_at, sf.created_at, u.name as shared_by_name, u.email as shared_by_email
    FROM shared_folders sf
    JOIN folders f ON sf.folder_id = f.id
    JOIN users u ON sf.shared_by = u.id
    WHERE sf.shared_with = $1
      AND (sf.expires_at IS NULL OR sf.expires_at > NOW())
  `;
  const [filesRes, foldersRes] = await Promise.all([
    query(filesQuery, [userId]),
    query(foldersQuery, [userId])
  ]);

  return [...filesRes.rows, ...foldersRes.rows].sort((a, b) => b.created_at - a.created_at);
};

module.exports = {
  createFileShare,
  createFolderShare,
  getFileShareById,
  getFolderShareById,
  getFileShareByToken,
  getFolderShareByToken,
  incrementFileShareView,
  incrementFolderShareView,
  deleteFileShare,
  deleteFolderShare,
  getSharesByUser,
  getSharedWithUser,
};
