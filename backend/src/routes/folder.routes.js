const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const { validate } = require('../validators/validate');
const {
  createFolderSchema,
  updateFolderSchema,
  getFoldersSchema,
} = require('../validators/folderValidator');
const {
  createFolder,
  getFolders,
  getFolder,
  renameFolder,
  deleteFolder,
} = require('../controllers/folderController');

const router = express.Router();

router.use(requireAuth);

router.post('/', createFolderSchema, validate, createFolder);
router.get('/', getFoldersSchema, validate, getFolders);
router.get('/:id', getFolder);
router.put('/:id', updateFolderSchema, validate, renameFolder);
router.delete('/:id', deleteFolder);

module.exports = router;
