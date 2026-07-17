const asyncHandler = require('../utils/asyncHandler');
const shareService = require('../services/shareService');
const shareModel = require('../models/shareModel');
const activityService = require('../services/activityService');
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
  const { password } = req.body;

  const data = await shareService.getPublicFile(token, password);
  res.status(200).json({ success: true, data });
});

const getPublicFolder = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const data = await shareService.getPublicFolder(token, password);
  res.status(200).json({ success: true, data });
});

const downloadPublicShare = asyncHandler(async (req, res) => {
  const { token } = req.params;
  // Use service to get file and validate token (will throw if invalid)
  const data = await shareService.getPublicFile(token, null);

  if (!data.allowDownload) {
    throw new ApiError(403, 'Download restricted by owner');
  }

  const https = require('https');
  res.setHeader('Content-Disposition', `attachment; filename="${data.name}"`);
  res.setHeader('Content-Type', data.mimeType || 'application/octet-stream');

  https.get(data.cloudinaryUrl, (stream) => {
    stream.pipe(res);
  }).on('error', (err) => {
    console.error('Error downloading from Cloudinary:', err);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  });
});

const downloadPublicFolderFile = asyncHandler(async (req, res) => {
  const { token, fileId } = req.params;
  const data = await shareService.getPublicFolder(token, null);

  if (!data.allowDownload) {
    throw new ApiError(403, 'Download restricted by owner');
  }

  // Find file in folder
  const file = data.contents.files.find(f => f.id === fileId);
  if (!file) throw new ApiError(404, 'File not found in this folder');

  const https = require('https');
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');

  https.get(file.downloadUrl, (stream) => {
    stream.pipe(res);
  }).on('error', (err) => {
    console.error('Error downloading from Cloudinary:', err);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  });
});

const getPublicShare = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const data = await shareService.getPublicShare(token, password);
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

  const https = require('https');
  res.setHeader('Content-Disposition', `attachment; filename="${share.original_name}"`);
  res.setHeader('Content-Type', share.mime_type || 'application/octet-stream');

  https.get(share.cloudinary_url, (stream) => {
    stream.pipe(res);
  }).on('error', (err) => {
    console.error('Error downloading from Cloudinary:', err);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  });
});

const streamPrivateShare = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // share id

  const share = await shareModel.getFileShareById(id);
  if (!share) throw new ApiError(404, 'Share not found');
  
  if (share.shared_with !== userId && share.shared_by !== userId) {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Access denied');
    }
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new ApiError(403, 'This share link has expired');
  }

  // Preview does not require allow_download permission.
  const https = require('https');
  res.setHeader('Content-Type', share.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${share.original_name}"`);

  https.get(share.cloudinary_url, (stream) => {
    stream.pipe(res);
  }).on('error', (err) => {
    console.error('Error streaming from Cloudinary:', err);
    res.status(500).json({ success: false, message: 'Failed to stream file' });
  });
});

const userModel = require('../models/userModel');

const createShare = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { itemId, itemType, accessType, sharedWith, permission } = req.body; 

  if (!itemId || !itemType || !accessType) {
    throw new ApiError(400, 'Missing required fields');
  }

  if (accessType === 'public') {
    let share;
    let isNew = true;

    if (itemType === 'file') {
      const existing = await shareModel.getPublicFileShareByFileId(itemId);
      share = await shareService.shareFile(userId, itemId, {
        permission: permission || 'read',
        isPublic: true,
      });
      isNew = !existing;
    } else if (itemType === 'folder') {
      const existing = await shareModel.getPublicFolderShareByFolderId(itemId);
      share = await shareService.shareFolder(userId, itemId, {
        permission: permission || 'read',
        isPublic: true,
      });
      isNew = !existing;
    } else {
      throw new ApiError(400, 'Invalid item type');
    }

    try {
      await activityService.logUserActivity(userId, 'SHARE', itemType, itemId, {
        accessType: 'public',
        publicToken: share.public_token,
      });
    } catch (logErr) {
      console.error('Activity log failed:', logErr.message);
    }

    return res.status(isNew ? 201 : 200).json({
      success: true,
      share: {
        id: share.id,
        isPublic: true,
        publicToken: share.public_token,
      },
    });
  }

  // Private sharing logic
  if (!sharedWith) {
    throw new ApiError(400, 'Missing sharedWith email for private share');
  }

  if (sharedWith.trim().toLowerCase() === req.user.email.trim().toLowerCase()) {
    throw new ApiError(400, 'You cannot share an item with yourself');
  }

  const targetUser = await userModel.findByEmail(sharedWith);
  if (!targetUser) {
    throw new ApiError(404, 'User not found. Please enter a valid registered email.');
  }

  // Check duplicate
  if (itemType === 'file') {
    const isDuplicate = await shareModel.checkDuplicateFileShare(itemId, targetUser.id);
    if (isDuplicate) throw new ApiError(400, 'This file is already shared with this user.');
    const share = await shareService.shareFile(userId, itemId, {
      sharedWithUserId: targetUser.id,
      permission: permission || 'read',
      isPublic: false
    });
    try {
      await activityService.logUserActivity(userId, 'SHARE', 'file', itemId, {
        accessType: 'private',
        sharedWith: targetUser.email,
        permission: permission || 'read',
      });
    } catch (logErr) {
      console.error('Activity log failed:', logErr.message);
    }
    res.status(201).json({ success: true, data: share });
  } else if (itemType === 'folder') {
    const isDuplicate = await shareModel.checkDuplicateFolderShare(itemId, targetUser.id);
    if (isDuplicate) throw new ApiError(400, 'This folder is already shared with this user.');
    const share = await shareService.shareFolder(userId, itemId, {
      sharedWithUserId: targetUser.id,
      permission: permission || 'read',
      isPublic: false
    });
    try {
      await activityService.logUserActivity(userId, 'SHARE', 'folder', itemId, {
        accessType: 'private',
        sharedWith: targetUser.email,
        permission: permission || 'read',
      });
    } catch (logErr) {
      console.error('Activity log failed:', logErr.message);
    }
    res.status(201).json({ success: true, data: share });
  } else {
    throw new ApiError(400, 'Invalid item type');
  }
});

const getItemAccess = asyncHandler(async (req, res) => {
  const { itemType, itemId } = req.params;

  let accessList = [];
  if (itemType === 'file' || itemType === 'files') {
    accessList = await shareModel.getSharesByFileId(itemId);
  } else if (itemType === 'folder' || itemType === 'folders') {
    accessList = await shareModel.getSharesByFolderId(itemId);
  } else {
    throw new ApiError(400, 'Invalid item type');
  }

  const privates = accessList.filter((s) => !s.public_token);
  const publicShares = accessList
    .filter((s) => s.public_token)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const canonicalPublic = publicShares.length > 0 ? [publicShares[0]] : [];

  res.status(200).json({ success: true, data: [...privates, ...canonicalPublic] });
});

const updateItemAccess = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // shareId
  const { itemType, permission } = req.body;

  if (!itemType || !permission) {
    throw new ApiError(400, 'Missing itemType or permission');
  }

  let updatedShare;
  if (itemType === 'file') {
    updatedShare = await shareModel.updateFileSharePermission(id, userId, permission);
  } else if (itemType === 'folder') {
    updatedShare = await shareModel.updateFolderSharePermission(id, userId, permission);
  } else {
    throw new ApiError(400, 'Invalid item type');
  }

  if (!updatedShare) {
    throw new ApiError(404, 'Share not found or access denied');
  }

  res.status(200).json({ success: true, data: updatedShare });
});

module.exports = {
  shareFile,
  shareFolder,
  getMyShares,
  getSharedWithMe,
  getPublicFile,
  getPublicFolder,
  getPublicShare,
  downloadPublicShare,
  downloadPublicFolderFile,
  revokeFileShare,
  revokeFolderShare,
  downloadPrivateShare,
  streamPrivateShare,
  createShare,
  getItemAccess,
  updateItemAccess,
};
