const asyncHandler = require('../utils/asyncHandler');
const shareService = require('../services/shareService');
const shareModel = require('../models/shareModel');
const { ApiError } = require('../utils/ApiError');

const shareFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { fileId } = req.params;
  const { sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt } = req.body;

  const share = await shareService.shareFile(userId, fileId, {
    sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt
  });

  res.status(201).json({ success: true, data: share });
});

const shareFolder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { folderId } = req.params;
  const { sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt } = req.body;

  const share = await shareService.shareFolder(userId, folderId, {
    sharedWithUserId, permission, isPublic, password, allowDownload, expiresAt
  });

  res.status(201).json({ success: true, data: share });
});

const getMyShares = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const shares = await shareService.getMyShares(userId);
  res.status(200).json({ success: true, data: shares });
});

const getSharedWithMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const shares = await shareService.getSharedWithMe(userId);
  res.status(200).json({ success: true, data: shares });
});

const getPublicFile = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body; // In case they POST to authenticate

  const data = await shareService.getPublicFile(token, password);
  res.status(200).json({ success: true, data });
});

const getPublicFolder = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const data = await shareService.getPublicFolder(token, password);
  res.status(200).json({ success: true, data });
});

const revokeFileShare = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  await shareService.revokeFileShare(userId, id);
  res.status(200).json({ success: true, message: 'File share revoked successfully' });
});

const revokeFolderShare = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  await shareService.revokeFolderShare(userId, id);
  res.status(200).json({ success: true, message: 'Folder share revoked successfully' });
});

const downloadPrivateShare = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // share id

  const share = await shareModel.getFileShareById(id);
  if (!share) throw new ApiError(404, 'Share not found');
  
  if (share.shared_with !== userId && share.shared_by !== userId) {
    // Check if user is admin (RBAC integration)
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new ApiError(403, 'This share link has expired');
  }

  if (!share.allow_download && share.shared_by !== userId && req.user.role !== 'admin') {
    throw new ApiError(403, 'Download restricted by owner');
  }

  res.status(200).json({
    success: true,
    data: {
      url: share.cloudinary_url,
      mimeType: share.mime_type,
      name: share.original_name
    }
  });
});

module.exports = {
  shareFile,
  shareFolder,
  getMyShares,
  getSharedWithMe,
  getPublicFile,
  getPublicFolder,
  revokeFileShare,
  revokeFolderShare,
  downloadPrivateShare,
};
