const bcrypt = require('bcryptjs');
const shareModel = require('../models/shareModel');
const fileModel = require('../models/fileModel');
const folderModel = require('../models/folderModel');
const { ApiError } = require('../utils/ApiError');
const {
  generatePublicToken,
  isValidPublicToken,
  sanitizePublicFileShare,
  sanitizePublicFolderShare,
} = require('../utils/shareHelpers');

const hashPassword = async (password) => {
  if (!password) return null;
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const checkExpiration = (expiresAt) => {
  if (expiresAt && new Date(expiresAt) < new Date()) {
    throw new ApiError(403, 'This share link has expired.');
  }
};

const assertValidPublicToken = (token) => {
  if (!isValidPublicToken(token)) {
    throw new ApiError(404, 'Invalid or expired share link');
  }
};

const enablePublicFileShare = async (userId, fileId, options = {}) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) throw new ApiError(404, 'File not found');
  if (file.owner_id !== userId) throw new ApiError(403, 'Forbidden: Only the owner can share this file');

  const existing = await shareModel.getPublicFileShareByFileId(fileId);
  if (existing) {
    return existing;
  }

  const { password, allowDownload, expiresAt } = options;
  let passwordHash = null;
  if (password) {
    passwordHash = await hashPassword(password);
  }

  const shareData = {
    file_id: fileId,
    shared_by: userId,
    shared_with: null,
    permission: options.permission || 'read',
    public_token: generatePublicToken(),
    password_hash: passwordHash,
    allow_download: allowDownload !== undefined ? allowDownload : true,
    expires_at: expiresAt || null,
  };

  return await shareModel.createFileShare(shareData);
};

const enablePublicFolderShare = async (userId, folderId, options = {}) => {
  const folder = await folderModel.getFolderById(folderId, userId);
  if (!folder) throw new ApiError(404, 'Folder not found or access denied');

  const existing = await shareModel.getPublicFolderShareByFolderId(folderId);
  if (existing) {
    return existing;
  }

  const { password, allowDownload, expiresAt } = options;
  let passwordHash = null;
  if (password) {
    passwordHash = await hashPassword(password);
  }

  const shareData = {
    folder_id: folderId,
    shared_by: userId,
    shared_with: null,
    permission: options.permission || 'read',
    public_token: generatePublicToken(),
    password_hash: passwordHash,
    allow_download: allowDownload !== undefined ? allowDownload : true,
    expires_at: expiresAt || null,
  };

  return await shareModel.createFolderShare(shareData);
};

const disablePublicFileShare = async (userId, fileId) => {
  const deleted = await shareModel.deletePublicFileShareByFileId(fileId, userId);
  if (!deleted) throw new ApiError(404, 'Public share not found or access denied');
};

const disablePublicFolderShare = async (userId, folderId) => {
  const deleted = await shareModel.deletePublicFolderShareByFolderId(folderId, userId);
  if (!deleted) throw new ApiError(404, 'Public share not found or access denied');
};

const shareFile = async (userId, fileId, options) => {
  const { sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt } = options;

  if (isPublic) {
    return await enablePublicFileShare(userId, fileId, { permission, password, allowDownload, expiresAt });
  }

  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) throw new ApiError(404, 'File not found');
  if (file.owner_id !== userId) throw new ApiError(403, 'Forbidden: Only the owner can share this file');

  const shareData = {
    file_id: fileId,
    shared_by: userId,
    shared_with: sharedWithUserId || null,
    permission: permission || 'read',
    public_token: null,
    password_hash: null,
    allow_download: allowDownload !== undefined ? allowDownload : true,
    expires_at: expiresAt || null,
  };

  return await shareModel.createFileShare(shareData);
};

const shareFolder = async (userId, folderId, options) => {
  const { sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt } = options;

  if (isPublic) {
    return await enablePublicFolderShare(userId, folderId, { permission, password, allowDownload, expiresAt });
  }

  const folder = await folderModel.getFolderById(folderId, userId);
  if (!folder) throw new ApiError(404, 'Folder not found or access denied');

  const shareData = {
    folder_id: folderId,
    shared_by: userId,
    shared_with: sharedWithUserId || null,
    permission: permission || 'read',
    public_token: null,
    password_hash: null,
    allow_download: allowDownload !== undefined ? allowDownload : true,
    expires_at: expiresAt || null,
  };

  return await shareModel.createFolderShare(shareData);
};

const verifySharePassword = async (share, password) => {
  if (!share.password_hash) return;

  if (!password) {
    throw new ApiError(401, 'Password required to access this item');
  }

  const isMatch = await bcrypt.compare(password, share.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid password');
  }
};

const getPublicFile = async (token, password = null) => {
  assertValidPublicToken(token);

  const share = await shareModel.getFileShareByToken(token);
  if (!share) throw new ApiError(404, 'Invalid or expired share link');

  checkExpiration(share.expires_at);
  await verifySharePassword(share, password);
  await shareModel.incrementFileShareView(share.id);

  return sanitizePublicFileShare(share);
};

const getPublicFolder = async (token, password = null) => {
  assertValidPublicToken(token);

  const share = await shareModel.getFolderShareByToken(token);
  if (!share) throw new ApiError(404, 'Invalid or expired share link');

  checkExpiration(share.expires_at);
  await verifySharePassword(share, password);
  await shareModel.incrementFolderShareView(share.id);

  const filesRes = await fileModel.getFilesByFolderId(share.shared_by, share.folder_id, 1000, 0);
  const foldersRes = await folderModel.getFolders(share.shared_by, share.folder_id);

  return sanitizePublicFolderShare(share, {
    files: filesRes.files,
    folders: foldersRes,
  });
};

const getPublicShare = async (token, password = null) => {
  assertValidPublicToken(token);

  const fileShare = await shareModel.getFileShareByToken(token);
  if (fileShare) {
    checkExpiration(fileShare.expires_at);
    await verifySharePassword(fileShare, password);
    await shareModel.incrementFileShareView(fileShare.id);
    return sanitizePublicFileShare(fileShare);
  }

  const folderShare = await shareModel.getFolderShareByToken(token);
  if (folderShare) {
    checkExpiration(folderShare.expires_at);
    await verifySharePassword(folderShare, password);
    await shareModel.incrementFolderShareView(folderShare.id);

    const filesRes = await fileModel.getFilesByFolderId(folderShare.shared_by, folderShare.folder_id, 1000, 0);
    const foldersRes = await folderModel.getFolders(folderShare.shared_by, folderShare.folder_id);

    return sanitizePublicFolderShare(folderShare, {
      files: filesRes.files,
      folders: foldersRes,
    });
  }

  throw new ApiError(404, 'Invalid or expired share link');
};

const getMyShares = async (userId) => {
  return await shareModel.getSharesByUser(userId);
};

const getSharedWithMe = async (userId) => {
  return await shareModel.getSharedWithUser(userId);
};

const revokeFileShare = async (userId, shareId) => {
  const deleted = await shareModel.deleteFileShare(shareId, userId);
  if (!deleted) throw new ApiError(404, 'Share not found or access denied');
};

const revokeFolderShare = async (userId, shareId) => {
  const deleted = await shareModel.deleteFolderShare(shareId, userId);
  if (!deleted) throw new ApiError(404, 'Share not found or access denied');
};

module.exports = {
  shareFile,
  shareFolder,
  enablePublicFileShare,
  enablePublicFolderShare,
  disablePublicFileShare,
  disablePublicFolderShare,
  getPublicFile,
  getPublicFolder,
  getPublicShare,
  getMyShares,
  getSharedWithMe,
  revokeFileShare,
  revokeFolderShare,
};
