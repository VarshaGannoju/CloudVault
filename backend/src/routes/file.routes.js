const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const { uploadFiles } = require('../middlewares/uploadMiddleware');
const { validate } = require('../validators/validate');
const {
  renameFileSchema,
  getFilesSchema,
  searchFilesSchema,
} = require('../validators/fileValidator');
const {
  uploadFile,
  uploadMultipleFiles,
  getFiles,
  searchFiles,
  renameFile,
  deleteFile,
  previewFile,
} = require('../controllers/fileController');

const router = express.Router();

router.use(requireAuth);

router.post('/upload', uploadFiles.single('file'), uploadFile);
router.post('/upload-multiple', uploadFiles.array('files', 10), uploadMultipleFiles);

router.get('/', getFilesSchema, validate, getFiles);
router.get('/search', searchFilesSchema, validate, searchFiles);

router.get('/:id/preview', previewFile);
router.put('/:id', renameFileSchema, validate, renameFile);
router.delete('/:id', deleteFile);

module.exports = router;
