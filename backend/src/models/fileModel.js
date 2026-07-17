const db = require('../config/db');

const createFile = async (fileData) => {
  const {
    owner_id,
    folder_id,
    original_name,
    extension,
    mime_type,
    size_bytes,
    cloudinary_public_id,
    cloudinary_url,
  } = fileData;

  const result = await db.query(
    `INSERT INTO files 
    (owner_id, folder_id, original_name, extension, mime_type, size_bytes, cloudinary_public_id, cloudinary_url) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [owner_id, folder_id, original_name, extension, mime_type, size_bytes, cloudinary_public_id, cloudinary_url]
  );
  return result.rows[0];
};

const getFileById = async (id, owner_id) => {
  const result = await db.query(
    'SELECT * FROM files WHERE id = $1 AND owner_id = $2 AND is_deleted = FALSE',
    [id, owner_id]
  );
  return result.rows[0];
};

const getFilesByFolderId = async (owner_id, folder_id = null, limit = 50, offset = 0) => {
  let query = 'SELECT * FROM files WHERE owner_id = $1 AND is_deleted = FALSE';
  const params = [owner_id];

  if (folder_id) {
    query += ' AND folder_id = $2';
    params.push(folder_id);
  } else {
    query += ' AND folder_id IS NULL';
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM files WHERE owner_id = $1 AND is_deleted = FALSE';
  const countParams = [owner_id];
  if (folder_id) {
    countQuery += ' AND folder_id = $2';
    countParams.push(folder_id);
  } else {
    countQuery += ' AND folder_id IS NULL';
  }
  const countResult = await db.query(countQuery, countParams);

  return {
    files: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

const searchFiles = async (owner_id, searchQuery, limit = 50, offset = 0) => {
  const result = await db.query(
    `SELECT * FROM files 
     WHERE owner_id = $1 AND is_deleted = FALSE AND original_name ILIKE $2
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [owner_id, `%${searchQuery}%`, limit, offset]
  );

  const countResult = await db.query(
    `SELECT COUNT(*) FROM files 
     WHERE owner_id = $1 AND is_deleted = FALSE AND original_name ILIKE $2`,
    [owner_id, `%${searchQuery}%`]
  );

  return {
    files: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

const getFileByIdAll = async (id) => {
  const result = await db.query(
    'SELECT * FROM files WHERE id = $1 AND is_deleted = FALSE',
    [id]
  );
  return result.rows[0];
};

const getFileByIdIncludingDeleted = async (id, owner_id) => {
  const result = await db.query(
    'SELECT * FROM files WHERE id = $1 AND owner_id = $2',
    [id, owner_id]
  );
  return result.rows[0];
};

const updateFile = async (id, original_name) => {
  const result = await db.query(
    'UPDATE files SET original_name = $1 WHERE id = $2 AND is_deleted = FALSE RETURNING *',
    [original_name, id]
  );
  return result.rows[0];
};

const trashFile = async (id, owner_id) => {
  const result = await db.query(
    'UPDATE files SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1 AND owner_id = $2 AND is_deleted = FALSE RETURNING *',
    [id, owner_id]
  );
  return result.rows[0];
};

const restoreFile = async (id, owner_id) => {
  const result = await db.query(
    'UPDATE files SET is_deleted = FALSE, deleted_at = NULL WHERE id = $1 AND owner_id = $2 AND is_deleted = TRUE RETURNING *',
    [id, owner_id]
  );
  return result.rows[0];
};

const permanentDeleteFile = async (id, owner_id) => {
  const result = await db.query(
    'DELETE FROM files WHERE id = $1 AND owner_id = $2 RETURNING *',
    [id, owner_id]
  );
  return result.rows[0];
};

const getDeletedFiles = async (owner_id, limit = 100, offset = 0) => {
  const result = await db.query(
    `SELECT * FROM files 
     WHERE owner_id = $1 AND is_deleted = TRUE 
     ORDER BY deleted_at DESC 
     LIMIT $2 OFFSET $3`,
    [owner_id, limit, offset]
  );

  const countResult = await db.query(
    'SELECT COUNT(*) FROM files WHERE owner_id = $1 AND is_deleted = TRUE',
    [owner_id]
  );

  return {
    files: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

const updateLastAccessed = async (id) => {
  const result = await db.query(
    'UPDATE files SET last_accessed_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
};

const updateFileVersionData = async (id, data) => {
  const { cloudinary_public_id, cloudinary_url, size_bytes, mime_type } = data;
  const result = await db.query(
    `UPDATE files 
     SET cloudinary_public_id = $1, cloudinary_url = $2, size_bytes = $3, mime_type = $4
     WHERE id = $5 
     RETURNING *`,
    [cloudinary_public_id, cloudinary_url, size_bytes, mime_type, id]
  );
  return result.rows[0];
};

const getRecentUploaded = async (owner_id, limit = 10) => {
  const result = await db.query(
    `SELECT * FROM files 
     WHERE owner_id = $1 AND is_deleted = FALSE 
     ORDER BY created_at DESC LIMIT $2`,
    [owner_id, limit]
  );
  return result.rows;
};

const getRecentModified = async (owner_id, limit = 10) => {
  const result = await db.query(
    `SELECT * FROM files 
     WHERE owner_id = $1 AND is_deleted = FALSE 
     ORDER BY updated_at DESC LIMIT $2`,
    [owner_id, limit]
  );
  return result.rows;
};

const getRecentAccessed = async (owner_id, limit = 10) => {
  const result = await db.query(
    `SELECT * FROM files 
     WHERE owner_id = $1 AND is_deleted = FALSE AND last_accessed_at IS NOT NULL 
     ORDER BY last_accessed_at DESC LIMIT $2`,
    [owner_id, limit]
  );
  return result.rows;
};

module.exports = {
  createFile,
  getFileById,
  getFileByIdAll,
  getFileByIdIncludingDeleted,
  getFilesByFolderId,
  searchFiles,
  updateFile,
  trashFile,
  restoreFile,
  permanentDeleteFile,
  getDeletedFiles,
  updateLastAccessed,
  updateFileVersionData,
  getRecentUploaded,
  getRecentModified,
  getRecentAccessed,
};
