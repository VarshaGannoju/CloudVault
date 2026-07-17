const asyncHandler = require('../utils/asyncHandler');
const fileService = require('../services/fileService');
const { ApiError } = require('../utils/ApiError');

const uploadFile = asyncHandler(async (req, res) => {
  const { folderId } = req.body;
  const ownerId = req.user.id;

  if (!req.file) {
    throw new ApiError(400, 'No file provided');
  }

  const fileRecord = await fileService.uploadFile(ownerId, req.file, folderId);

  res.status(201).json({
    success: true,
    data: fileRecord,
  });
});

const uploadMultipleFiles = asyncHandler(async (req, res) => {
  const { folderId } = req.body;
  const ownerId = req.user.id;

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files provided');
  }

  const uploadPromises = req.files.map((file) => fileService.uploadFile(ownerId, file, folderId));
  const fileRecords = await Promise.all(uploadPromises);

  res.status(201).json({
    success: true,
    data: fileRecords,
  });
});

const getFiles = asyncHandler(async (req, res) => {
  const { folderId, page, limit } = req.query;
  const ownerId = req.user.id;

  const result = await fileService.getFiles(ownerId, folderId, page, limit);

  res.status(200).json({
    success: true,
    ...result,
  });
});

const searchFiles = asyncHandler(async (req, res) => {
  const { query, page, limit } = req.query;
  const ownerId = req.user.id;

  const result = await fileService.searchFiles(ownerId, query, page, limit);

  res.status(200).json({
    success: true,
    ...result,
  });
});

const renameFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const ownerId = req.user.id;

  const updatedFile = await fileService.renameFile(id, ownerId, name);

  res.status(200).json({
    success: true,
    data: updatedFile,
  });
});

const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  await fileService.deleteFile(id, ownerId);

  res.status(200).json({
    success: true,
    message: 'File moved to trash',
  });
});

const restoreFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  const restored = await fileService.restoreFile(id, ownerId);

  res.status(200).json({
    success: true,
    data: restored,
    message: 'File restored successfully',
  });
});

const permanentDeleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  await fileService.permanentDeleteFile(id, ownerId);

  res.status(200).json({
    success: true,
    message: 'File permanently deleted',
  });
});

const getTrashFiles = asyncHandler(async (req, res) => {
  const ownerId = req.user.id;
  const { page, limit } = req.query;

  const result = await fileService.getTrashFiles(ownerId, page, limit);

  res.status(200).json({
    success: true,
    ...result,
  });
});

const previewFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  const preview = await fileService.previewFile(id, ownerId);

  res.status(200).json({
    success: true,
    data: preview,
  });
});

const https = require('https');

const downloadFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const file = await fileService.downloadFile(id, userId);

  res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');

  https.get(file.cloudinary_url, (stream) => {
    stream.pipe(res);
  }).on('error', (err) => {
    console.error('Error downloading from Cloudinary:', err);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  });
});

const streamFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const file = await fileService.getFileForStream(id, userId);

  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);

  https.get(file.cloudinary_url, (stream) => {
    stream.pipe(res);
  }).on('error', (err) => {
    console.error('Error streaming from Cloudinary:', err);
    res.status(500).json({ success: false, message: 'Failed to stream file' });
  });
});

const copyFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { folderId } = req.body;
  const userId = req.user.id;

  const copied = await fileService.makeCopy(fileId, userId, folderId);

  res.status(201).json({
    success: true,
    data: copied,
    message: 'File copied successfully',
  });
});

const starFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await fileService.starFile(id, userId);

  res.status(200).json({
    success: true,
    message: 'File starred',
  });
});

const unstarFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await fileService.unstarFile(id, userId);

  res.status(200).json({
    success: true,
    message: 'File unstarred',
  });
});

const getStarredFiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit } = req.query;

  const result = await fileService.getStarredFiles(userId, page, limit);

  res.status(200).json({
    success: true,
    ...result,
  });
});

const getRecentFiles = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await fileService.getRecentFiles(userId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const uploadNewVersion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!req.file) {
    throw new ApiError(400, 'No file provided');
  }

  const updated = await fileService.uploadNewVersion(id, userId, req.file);

  res.status(200).json({
    success: true,
    data: updated,
    message: 'New version uploaded',
  });
});

const getFileVersions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { page, limit } = req.query;

  const result = await fileService.getFileVersions(id, userId, page, limit);

  res.status(200).json({
    success: true,
    ...result,
  });
});

const restoreVersion = asyncHandler(async (req, res) => {
  const { id, versionId } = req.params;
  const userId = req.user.id;

  const restored = await fileService.restoreVersion(id, versionId, userId);

  res.status(200).json({
    success: true,
    data: restored,
    message: 'Version restored successfully',
  });
});

// One-off admin utility: GET /files/fix-mime-types           -> dry run
//                        GET /files/fix-mime-types?apply=true -> applies fix
const fixMimeTypes = asyncHandler(async (req, res) => {
  const apply = req.query.apply === 'true';
  const result = await fileService.fixAllMimeTypes(apply);

  res.status(200).json({
    success: true,
    mode: apply ? 'applied' : 'dry-run',
    ...result,
  });
});

// One-off admin utility: GET /files/reconcile-storage           -> dry run
//                        GET /files/reconcile-storage?apply=true -> applies fix
const reconcileStorage = asyncHandler(async (req, res) => {
  const apply = req.query.apply === 'true';
  const result = await fileService.reconcileStorage(apply);

  res.status(200).json({
    success: true,
    mode: apply ? 'applied' : 'dry-run',
    ...result,
  });
});

module.exports = {
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
};