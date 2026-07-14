const asyncHandler = require('../utils/asyncHandler');
const folderService = require('../services/folderService');

const createFolder = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const ownerId = req.user.id;

  const folder = await folderService.createFolder(ownerId, name, parentId);

  res.status(201).json({
    success: true,
    data: folder,
  });
});

const getFolders = asyncHandler(async (req, res) => {
  const { parentId } = req.query;
  const ownerId = req.user.id;

  const folders = await folderService.getFolders(ownerId, parentId);

  res.status(200).json({
    success: true,
    data: folders,
  });
});

const getFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  const folder = await folderService.getFolder(id, ownerId);

  res.status(200).json({
    success: true,
    data: folder,
  });
});

const renameFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const ownerId = req.user.id;

  const folder = await folderService.renameFolder(id, ownerId, name);

  res.status(200).json({
    success: true,
    data: folder,
  });
});

const deleteFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  await folderService.deleteFolder(id, ownerId);

  res.status(200).json({
    success: true,
    message: 'Folder deleted successfully',
  });
});

module.exports = {
  createFolder,
  getFolders,
  getFolder,
  renameFolder,
  deleteFolder,
};
