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
  restoreFile,
  permanentDeleteFile,
  getTrashFiles,
  previewFile,
  downloadFile,
  streamFile,
  copyFile,
  starFile,
  unstarFile,
  getStarredFiles,
  getRecentFiles,
  uploadNewVersion,
  getFileVersions,
  restoreVersion,
  fixMimeTypes,
  reconcileStorage,
} = require('../controllers/fileController');

const router = express.Router();

router.use(requireAuth);

router.post('/upload', uploadFiles.single('file'), uploadFile);
router.post('/upload-multiple', uploadFiles.array('files', 10), uploadMultipleFiles);

router.get('/', getFilesSchema, validate, getFiles);
router.get('/search', searchFilesSchema, validate, searchFiles);
router.get('/trash', getTrashFiles);
router.get('/starred', getStarredFiles);
router.get('/recent', getRecentFiles);

// One-off admin utilities. Remove these routes once the repairs have been run.
// GET /files/fix-mime-types              -> dry run
// GET /files/fix-mime-types?apply=true   -> applies mime_type fix
router.get('/fix-mime-types', fixMimeTypes);
// GET /files/reconcile-storage              -> dry run
// GET /files/reconcile-storage?apply=true   -> applies storage_used_bytes fix
router.get('/reconcile-storage', reconcileStorage);

router.get('/:id/preview', previewFile);
router.get('/:id/download', downloadFile);
router.get('/:id/stream', streamFile);
router.put('/:id', renameFileSchema, validate, renameFile);
router.delete('/:id', deleteFile);
router.post('/:id/restore', restoreFile);
router.delete('/:id/permanent-delete', permanentDeleteFile);

router.post('/:id/star', starFile);
router.delete('/:id/star', unstarFile);

router.post('/:fileId/copy', copyFile);

router.post('/:id/versions', uploadFiles.single('file'), uploadNewVersion);
router.get('/:id/versions', getFileVersions);
router.post('/:id/versions/:versionId/restore', restoreVersion);

module.exports = router;