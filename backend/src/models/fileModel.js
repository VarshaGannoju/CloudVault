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
    'SELECT * FROM files WHERE id = $1 AND owner_id = $2 AND is_trashed = FALSE',
    [id, owner_id]
  );
  return result.rows[0];
};

const getFilesByFolderId = async (owner_id, folder_id = null, limit = 50, offset = 0) => {
  let query = 'SELECT * FROM files WHERE owner_id = $1 AND is_trashed = FALSE';
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
  let countQuery = 'SELECT COUNT(*) FROM files WHERE owner_id = $1 AND is_trashed = FALSE';
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
  // Using ilike for search. pg_trgm could be used here.
  const result = await db.query(
    `SELECT * FROM files 
     WHERE owner_id = $1 AND is_trashed = FALSE AND original_name ILIKE $2
     ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
    [owner_id, `%${searchQuery}%`, limit, offset]
  );

  const countResult = await db.query(
    `SELECT COUNT(*) FROM files 
     WHERE owner_id = $1 AND is_trashed = FALSE AND original_name ILIKE $2`,
    [owner_id, `%${searchQuery}%`]
  );

  return {
    files: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
};

const updateFile = async (id, owner_id, original_name) => {
  const result = await db.query(
    'UPDATE files SET original_name = $1 WHERE id = $2 AND owner_id = $3 AND is_trashed = FALSE RETURNING *',
    [original_name, id, owner_id]
  );
  return result.rows[0];
};

const trashFile = async (id, owner_id) => {
  const result = await db.query(
    'UPDATE files SET is_trashed = TRUE, trashed_at = NOW() WHERE id = $1 AND owner_id = $2 RETURNING *',
    [id, owner_id]
  );
  return result.rows[0];
};

const deleteFile = async (id, owner_id) => {
  const result = await db.query(
    'DELETE FROM files WHERE id = $1 AND owner_id = $2 RETURNING *',
    [id, owner_id]
  );
  return result.rows[0];
};

module.exports = {
  createFile,
  getFileById,
  getFilesByFolderId,
  searchFiles,
  updateFile,
  trashFile,
  deleteFile,
};
