const fileModel = require('../models/fileModel');
const folderModel = require('../models/folderModel');
const cloudinaryService = require('./cloudinaryService');
const userModel = require('../models/userModel');
const activityService = require('./activityService');
const { ApiError } = require('../utils/ApiError');

const getFileTypeAndExtension = (originalName, mimetype) => {
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  
  let resourceType = 'raw';
  if (mimetype.startsWith('image/')) resourceType = 'image';
  else if (mimetype.startsWith('video/')) resourceType = 'video';
  
  return { extension, resourceType };
};

const uploadFile = async (ownerId, file, folderId = null) => {
  if (folderId) {
    const folder = await folderModel.getFolderById(folderId, ownerId);
    if (!folder) {
      throw new ApiError(404, 'Folder not found');
    }
  }

  const user = await userModel.findById(ownerId);
  if (!user) throw new ApiError(404, 'User not found');
  
  const usedBytes = Number(user.storage_used_bytes);
  const limitBytes = Number(user.storage_limit_bytes);
  if (usedBytes + file.size > limitBytes) {
    throw new ApiError(400, 'Storage limit exceeded');
  }

  const { extension, resourceType } = getFileTypeAndExtension(file.originalname, file.mimetype);

  // Upload to Cloudinary
  const uploadResult = await cloudinaryService.uploadBufferToCloudinary(file.buffer, {
    resource_type: resourceType,
    folder: `cloudvault/${ownerId}`,
  });

  // Save to DB
  const fileRecord = await fileModel.createFile({
    owner_id: ownerId,
    folder_id: folderId || null,
    original_name: file.originalname,
    extension,
    mime_type: file.mimetype,
    size_bytes: file.size,
    cloudinary_public_id: uploadResult.public_id,
    cloudinary_url: uploadResult.secure_url,
  });

  await userModel.updateStorageUsed(ownerId, file.size);
  await activityService.logUserActivity(ownerId, 'file.upload', 'file', fileRecord.id, { size: file.size, name: file.originalname });

  return fileRecord;
};

const getFiles = async (ownerId, folderId = null, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const result = await fileModel.getFilesByFolderId(ownerId, folderId, limit, offset);
  
  return {
    files: result.files,
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

const searchFiles = async (ownerId, query, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const result = await fileModel.searchFiles(ownerId, query, limit, offset);

  return {
    files: result.files,
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

const renameFile = async (fileId, ownerId, newName) => {
  const file = await fileModel.getFileById(fileId, ownerId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  const updatedFile = await fileModel.updateFile(fileId, ownerId, newName);
  await activityService.logUserActivity(ownerId, 'file.rename', 'file', fileId, { oldName: file.original_name, newName });
  return updatedFile;
};

const deleteFile = async (fileId, ownerId) => {
  const file = await fileModel.getFileById(fileId, ownerId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  // Hard delete from Cloudinary and DB for complete Step 3 deletion
  let resourceType = 'raw';
  if (file.mime_type.startsWith('image/')) resourceType = 'image';
  else if (file.mime_type.startsWith('video/')) resourceType = 'video';

  await cloudinaryService.deleteFromCloudinary(file.cloudinary_public_id, resourceType);
  await fileModel.deleteFile(fileId, ownerId);
  await userModel.updateStorageUsed(ownerId, -file.size_bytes);
  await activityService.logUserActivity(ownerId, 'file.delete', 'file', fileId, { name: file.original_name });
};

const previewFile = async (fileId, ownerId) => {
  const file = await fileModel.getFileById(fileId, ownerId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  await activityService.logUserActivity(ownerId, 'file.download', 'file', fileId, { name: file.original_name });

  return {
    url: file.cloudinary_url,
    mimeType: file.mime_type,
    name: file.original_name,
  };
};

module.exports = {
  uploadFile,
  getFiles,
  searchFiles,
  renameFile,
  deleteFile,
  previewFile,
};
