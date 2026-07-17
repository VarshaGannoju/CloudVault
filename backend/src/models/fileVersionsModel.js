const { query } = require('../config/db');

const createVersion = async (data) => {
  const text = `
    INSERT INTO file_versions (file_id, version_number, uploaded_by, cloudinary_public_id, cloudinary_url, size_bytes)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [
    data.file_id,
    data.version_number,
    data.uploaded_by,
    data.cloudinary_public_id,
    data.cloudinary_url,
    data.size_bytes,
  ];
  const { rows } = await query(text, values);
  return rows[0];
};

const getVersionsByFileId = async (fileId, limit = 50, offset = 0) => {
  const text = `
    SELECT fv.*, u.name as uploaded_by_name
    FROM file_versions fv
    JOIN users u ON fv.uploaded_by = u.id
    WHERE fv.file_id = $1
    ORDER BY fv.version_number DESC
    LIMIT $2 OFFSET $3
  `;
  const countText = `SELECT COUNT(*) FROM file_versions WHERE file_id = $1`;

  const [rowsRes, countRes] = await Promise.all([
    query(text, [fileId, limit, offset]),
    query(countText, [fileId]),
  ]);

  return {
    versions: rowsRes.rows,
    total: parseInt(countRes.rows[0].count, 10),
  };
};

const getVersionById = async (versionId) => {
  const text = `
    SELECT fv.*, f.owner_id
    FROM file_versions fv
    JOIN files f ON fv.file_id = f.id
    WHERE fv.id = $1
  `;
  const { rows } = await query(text, [versionId]);
  return rows[0];
};

const getNextVersionNumber = async (fileId) => {
  const text = `
    SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
    FROM file_versions
    WHERE file_id = $1
  `;
  const { rows } = await query(text, [fileId]);
  return parseInt(rows[0].next_version, 10);
};

const deleteVersion = async (versionId) => {
  const text = `
    DELETE FROM file_versions
    WHERE id = $1
    RETURNING *;
  `;
  const { rows } = await query(text, [versionId]);
  return rows[0];
};

module.exports = {
  createVersion,
  getVersionsByFileId,
  getVersionById,
  getNextVersionNumber,
  deleteVersion,
};
