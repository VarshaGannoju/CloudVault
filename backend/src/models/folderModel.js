const db = require('../config/db');

const createFolder = async (owner_id, name, parent_id = null) => {
  const result = await db.query(
    'INSERT INTO folders (owner_id, name, parent_id) VALUES ($1, $2, $3) RETURNING *',
    [owner_id, name, parent_id]
  );
  return result.rows[0];
};

const getFolderById = async (id, owner_id) => {
  const result = await db.query(
    'SELECT * FROM folders WHERE id = $1 AND owner_id = $2 AND is_trashed = FALSE',
    [id, owner_id]
  );
  return result.rows[0];
};

const getFoldersByParentId = async (owner_id, parent_id = null) => {
  let query = 'SELECT * FROM folders WHERE owner_id = $1 AND is_trashed = FALSE';
  const params = [owner_id];
  
  if (parent_id) {
    query += ' AND parent_id = $2';
    params.push(parent_id);
  } else {
    query += ' AND parent_id IS NULL';
  }

  query += ' ORDER BY name ASC';
  
  const result = await db.query(query, params);
  return result.rows;
};

const updateFolder = async (id, owner_id, name) => {
  const result = await db.query(
    'UPDATE folders SET name = $1 WHERE id = $2 AND owner_id = $3 AND is_trashed = FALSE RETURNING *',
    [name, id, owner_id]
  );
  return result.rows[0];
};

const trashFolder = async (id, owner_id) => {
  const result = await db.query(
    'UPDATE folders SET is_trashed = TRUE, trashed_at = NOW() WHERE id = $1 AND owner_id = $2 RETURNING *',
    [id, owner_id]
  );
  return result.rows[0];
};

const deleteFolder = async (id, owner_id) => {
  const result = await db.query(
    'DELETE FROM folders WHERE id = $1 AND owner_id = $2 RETURNING *',
    [id, owner_id]
  );
  return result.rows[0];
};

module.exports = {
  createFolder,
  getFolderById,
  getFoldersByParentId,
  updateFolder,
  trashFolder,
  deleteFolder,
};
