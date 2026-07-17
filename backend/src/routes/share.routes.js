const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
// const { requireRole } = require('../middlewares/roleMiddleware');
const shareController = require('../controllers/shareController');

const router = express.Router();

// Public Routes
router.get('/public/:token', shareController.getPublicShare);
router.post('/public/:token', shareController.getPublicShare);
router.get('/public/files/:token', shareController.getPublicFile);
router.post('/public/files/:token', shareController.getPublicFile);
router.get('/public/files/:token/download', shareController.downloadPublicShare);
router.get('/public/folders/:token', shareController.getPublicFolder);
router.post('/public/folders/:token', shareController.getPublicFolder);
router.get('/public/folders/:token/files/:fileId/download', shareController.downloadPublicFolderFile);

// Protected Routes
router.use(requireAuth);

router.post('/files/:fileId', shareController.shareFile);
router.post('/folders/:folderId', shareController.shareFolder);

router.get('/my-shares', shareController.getMyShares);
router.get('/shared-with-me', shareController.getSharedWithMe);

router.delete('/files/:id', shareController.revokeFileShare);
router.delete('/folders/:id', shareController.revokeFolderShare);

router.get('/files/:id/download', shareController.downloadPrivateShare);
router.get('/files/:id/stream', shareController.streamPrivateShare);

// New unified share endpoints
router.post('/', shareController.createShare);
router.get('/item/:itemType/:itemId/access', shareController.getItemAccess);
router.put('/access/:id', shareController.updateItemAccess);

module.exports = router;
