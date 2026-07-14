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
    message: 'File deleted successfully',
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

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  getFiles,
  searchFiles,
  renameFile,
  deleteFile,
  previewFile,
};
