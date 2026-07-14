const folderModel = require('../models/folderModel');
const activityService = require('./activityService');
const ApiError = require('../utils/ApiError');

const createFolder = async (ownerId, name, parentId = null) => {
  if (parentId) {
    const parentFolder = await folderModel.getFolderById(parentId, ownerId);
    if (!parentFolder) {
      throw new ApiError(404, 'Parent folder not found');
    }
  }

  const folder = await folderModel.createFolder(ownerId, name, parentId);
  await activityService.logUserActivity(ownerId, 'folder.create', 'folder', folder.id, { name });
  return folder;
};

const getFolders = async (ownerId, parentId = null) => {
  if (parentId) {
    const parentFolder = await folderModel.getFolderById(parentId, ownerId);
    if (!parentFolder) {
      throw new ApiError(404, 'Folder not found');
    }
  }

  const folders = await folderModel.getFoldersByParentId(ownerId, parentId);
  return folders;
};

const getFolder = async (folderId, ownerId) => {
  const folder = await folderModel.getFolderById(folderId, ownerId);
  if (!folder) {
    throw new ApiError(404, 'Folder not found');
  }
  return folder;
};

const renameFolder = async (folderId, ownerId, newName) => {
  const folder = await folderModel.getFolderById(folderId, ownerId);
  if (!folder) {
    throw new ApiError(404, 'Folder not found');
  }

  const updated = await folderModel.updateFolder(folderId, ownerId, newName);
  await activityService.logUserActivity(ownerId, 'folder.rename', 'folder', folderId, { oldName: folder.name, newName });
  return updated;
};

const deleteFolder = async (folderId, ownerId) => {
  const folder = await folderModel.getFolderById(folderId, ownerId);
  if (!folder) {
    throw new ApiError(404, 'Folder not found');
  }

  // Soft delete for now
  await folderModel.trashFolder(folderId, ownerId);
  await activityService.logUserActivity(ownerId, 'folder.delete', 'folder', folderId, { name: folder.name });
};

module.exports = {
  createFolder,
  getFolders,
  getFolder,
  renameFolder,
  deleteFolder,
};
