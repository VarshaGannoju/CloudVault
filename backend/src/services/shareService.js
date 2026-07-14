const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const shareModel = require('../models/shareModel');
const fileModel = require('../models/fileModel');
const folderModel = require('../models/folderModel');
const { ApiError } = require('../utils/ApiError');

const generatePublicToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

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

const shareFile = async (userId, fileId, options) => {
  const file = await fileModel.getFileById(fileId, userId);
  if (!file) throw new ApiError(404, 'File not found or access denied');

  const { sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt } = options;

  let publicToken = null;
  let passwordHash = null;

  if (isPublic) {
    publicToken = generatePublicToken();
    if (password) {
      passwordHash = await hashPassword(password);
    }
  }

  const shareData = {
    file_id: fileId,
    shared_by: userId,
    shared_with: sharedWithUserId || null,
    permission: permission || 'read',
    public_token: publicToken,
    password_hash: passwordHash,
    allow_download: allowDownload !== undefined ? allowDownload : true,
    expires_at: expiresAt || null,
  };

  return await shareModel.createFileShare(shareData);
};

const shareFolder = async (userId, folderId, options) => {
  const folder = await folderModel.getFolderById(folderId, userId);
  if (!folder) throw new ApiError(404, 'Folder not found or access denied');

  const { sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt } = options;

  let publicToken = null;
  let passwordHash = null;

  if (isPublic) {
    publicToken = generatePublicToken();
    if (password) {
      passwordHash = await hashPassword(password);
    }
  }

  const shareData = {
    folder_id: folderId,
    shared_by: userId,
    shared_with: sharedWithUserId || null,
    permission: permission || 'read',
    public_token: publicToken,
    password_hash: passwordHash,
    allow_download: allowDownload !== undefined ? allowDownload : true,
    expires_at: expiresAt || null,
  };

  return await shareModel.createFolderShare(shareData);
};

const getPublicFile = async (token, password = null) => {
  const share = await shareModel.getFileShareByToken(token);
  if (!share) throw new ApiError(404, 'Invalid or expired share link');

  checkExpiration(share.expires_at);

  if (share.password_hash) {
    if (!password) {
      throw new ApiError(401, 'Password required to access this file');
    }
    const isMatch = await bcrypt.compare(password, share.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid password');
    }
  }

  await shareModel.incrementFileShareView(share.id);

  // Return file info without password hash
  delete share.password_hash;
  return share;
};

const getPublicFolder = async (token, password = null) => {
  const share = await shareModel.getFolderShareByToken(token);
  if (!share) throw new ApiError(404, 'Invalid or expired share link');

  checkExpiration(share.expires_at);

  if (share.password_hash) {
    if (!password) {
      throw new ApiError(401, 'Password required to access this folder');
    }
    const isMatch = await bcrypt.compare(password, share.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid password');
    }
  }

  await shareModel.incrementFolderShareView(share.id);

  // Return folder info without password hash
  delete share.password_hash;
  
  // Also get the contents of this folder! For a public link, we'll return its immediate children files/folders
  const folderContents = { files: [], folders: [] };
  // We can fetch files directly by folder_id
  const filesRes = await fileModel.getFilesByFolderId(share.shared_by, share.folder_id, 1000, 0);
  folderContents.files = filesRes.files;
  // We can fetch subfolders too
  const foldersRes = await folderModel.getFolders(share.shared_by, share.folder_id);
  folderContents.folders = foldersRes;

  return { share, contents: folderContents };
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
  getPublicFile,
  getPublicFolder,
  getMyShares,
  getSharedWithMe,
  revokeFileShare,
  revokeFolderShare,
};
