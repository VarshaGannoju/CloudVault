const fileModel = require('../models/fileModel');
const folderModel = require('../models/folderModel');
const userModel = require('../models/userModel');
const favoritesModel = require('../models/favoritesModel');
const fileVersionsModel = require('../models/fileVersionsModel');
const cloudinaryService = require('./cloudinaryService');
const activityService = require('./activityService');
const shareModel = require('../models/shareModel');
const { ApiError } = require('../utils/ApiError');
const { fileTypeFromBuffer } = require('file-type');
const https = require('https');
const db = require('../config/db');

const getResourceType = (mimeType) => {
  if (!mimeType) return 'raw';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};

const getFileTypeAndExtension = (originalName, mimetype) => {
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  const resourceType = getResourceType(mimetype);
  return { extension, resourceType };
};

const detectRealMimeType = async (buffer, fallbackMimeType) => {
  try {
    const detected = await fileTypeFromBuffer(buffer);
    return detected?.mime || fallbackMimeType;
  } catch (err) {
    console.error('MIME type detection failed, falling back to reported type:', err);
    return fallbackMimeType;
  }
};

const downloadBuffer = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });

const getExtensionFromName = (name) => {
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const assertFileAccess = async (file, userId, requireEdit = false) => {
  if (file.owner_id === userId) return;

  const access = await shareModel.checkUserAccessToFile(file.id, userId);
  if (!access) {
    throw new ApiError(403, 'Access denied');
  }
  if (requireEdit && access.permission !== 'edit') {
    throw new ApiError(403, 'Edit permission required');
  }
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

  const realMimeType = await detectRealMimeType(file.buffer, file.mimetype);
  const { extension, resourceType } = getFileTypeAndExtension(file.originalname, realMimeType);

  const uploadResult = await cloudinaryService.uploadBufferToCloudinary(file.buffer, {
    resource_type: resourceType,
    folder: `cloudvault/${ownerId}`,
  });

  const fileRecord = await fileModel.createFile({
    owner_id: ownerId,
    folder_id: folderId || null,
    original_name: file.originalname,
    extension,
    mime_type: realMimeType,
    size_bytes: file.size,
    cloudinary_public_id: uploadResult.public_id,
    cloudinary_url: uploadResult.secure_url,
  });

  await userModel.updateStorageUsed(ownerId, file.size);
  await activityService.logUserActivity(ownerId, 'UPLOAD', 'file', fileRecord.id, { name: file.originalname });

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

const renameFile = async (fileId, userId, newName) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  await assertFileAccess(file, userId, true);

  const updatedFile = await fileModel.updateFile(fileId, newName);
  await activityService.logUserActivity(userId, 'RENAME', 'file', fileId, { oldName: file.original_name, newName });
  return updatedFile;
};

const deleteFile = async (fileId, userId) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  if (file.owner_id !== userId) {
    throw new ApiError(403, 'Forbidden: Only the owner can delete this file');
  }

  const trashed = await fileModel.trashFile(fileId, userId);
  if (!trashed) {
    throw new ApiError(400, 'File is already in trash');
  }

  await activityService.logUserActivity(userId, 'DELETE', 'file', fileId, { name: file.original_name });
};

const restoreFile = async (fileId, userId) => {
  const file = await fileModel.getFileByIdIncludingDeleted(fileId, userId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  if (file.owner_id !== userId) {
    throw new ApiError(403, 'Forbidden: Only the owner can restore this file');
  }

  const restored = await fileModel.restoreFile(fileId, userId);
  if (!restored) {
    throw new ApiError(400, 'File is not in trash');
  }

  await activityService.logUserActivity(userId, 'RESTORE', 'file', fileId, { name: restored.original_name });
  return restored;
};

const permanentDeleteFile = async (fileId, userId) => {
  const file = await fileModel.getFileByIdIncludingDeleted(fileId, userId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  if (file.owner_id !== userId) {
    throw new ApiError(403, 'Forbidden: Only the owner can permanently delete this file');
  }

  // Delete current asset and all historical version assets from Cloudinary.
  const resourceType = getResourceType(file.mime_type);
  await cloudinaryService.deleteFromCloudinary(file.cloudinary_public_id, resourceType);

  const versions = await fileVersionsModel.getVersionsByFileId(fileId, 1000, 0);
  for (const version of versions.versions) {
    const vResourceType = getResourceType(file.mime_type);
    await cloudinaryService.deleteFromCloudinary(version.cloudinary_public_id, vResourceType);
  }

  await fileModel.permanentDeleteFile(fileId, userId);
  await userModel.updateStorageUsed(userId, -file.size_bytes);
};

const getTrashFiles = async (ownerId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const result = await fileModel.getDeletedFiles(ownerId, limit, offset);

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

const previewFile = async (fileId, userId) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  await assertFileAccess(file, userId);
  await fileModel.updateLastAccessed(fileId);
  await activityService.logUserActivity(userId, 'DOWNLOAD', 'file', fileId, { name: file.original_name, preview: true });

  return {
    url: file.cloudinary_url,
    mimeType: file.mime_type,
    name: file.original_name,
  };
};

const downloadFile = async (fileId, userId) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) throw new ApiError(404, 'File not found');

  await assertFileAccess(file, userId);
  await fileModel.updateLastAccessed(fileId);
  await activityService.logUserActivity(userId, 'DOWNLOAD', 'file', fileId, { name: file.original_name });
  return file;
};

const getFileForStream = async (fileId, userId) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) throw new ApiError(404, 'File not found');
  await assertFileAccess(file, userId);
  return file;
};

const makeCopy = async (fileId, userId, destinationFolderId = null) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  await assertFileAccess(file, userId);

  if (destinationFolderId) {
    const folder = await folderModel.getFolderById(destinationFolderId, userId);
    if (!folder) {
      throw new ApiError(404, 'Destination folder not found');
    }
  }

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.storage_used_bytes + file.size_bytes > user.storage_limit_bytes) {
    throw new ApiError(400, 'Storage limit exceeded');
  }

  // Build "Name (Copy).ext"
  let copyName = file.original_name;
  const dotIndex = copyName.lastIndexOf('.');
  if (dotIndex > 0) {
    copyName = `${copyName.slice(0, dotIndex)} (Copy)${copyName.slice(dotIndex)}`;
  } else {
    copyName = `${copyName} (Copy)`;
  }

  const copied = await fileModel.createFile({
    owner_id: userId,
    folder_id: destinationFolderId || null,
    original_name: copyName,
    extension: file.extension,
    mime_type: file.mime_type,
    size_bytes: file.size_bytes,
    cloudinary_public_id: file.cloudinary_public_id,
    cloudinary_url: file.cloudinary_url,
  });

  await userModel.updateStorageUsed(userId, file.size_bytes);
  await activityService.logUserActivity(userId, 'COPY', 'file', copied.id, { name: copyName, sourceId: file.id });

  return copied;
};

const starFile = async (fileId, userId) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  await assertFileAccess(file, userId);

  const favorite = await favoritesModel.addFavorite(userId, fileId);
  if (favorite) {
    await activityService.logUserActivity(userId, 'STAR', 'file', fileId, { name: file.original_name });
  }
  return favorite;
};

const unstarFile = async (fileId, userId) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  const removed = await favoritesModel.removeFavorite(userId, fileId);
  if (removed) {
    await activityService.logUserActivity(userId, 'UNSTAR', 'file', fileId, { name: file.original_name });
  }
  return removed;
};

const getStarredFiles = async (userId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const result = await favoritesModel.getFavoritesByUser(userId, limit, offset);

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

const uploadNewVersion = async (fileId, userId, file) => {
  const existing = await fileModel.getFileByIdAll(fileId);
  if (!existing) {
    throw new ApiError(404, 'File not found');
  }

  await assertFileAccess(existing, userId, true);

  const user = await userModel.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const delta = file.size - existing.size_bytes;
  if (user.storage_used_bytes + delta > user.storage_limit_bytes) {
    throw new ApiError(400, 'Storage limit exceeded');
  }

  const realMimeType = await detectRealMimeType(file.buffer, file.mimetype);
  const { resourceType } = getFileTypeAndExtension(file.originalname, realMimeType);
  const uploadResult = await cloudinaryService.uploadBufferToCloudinary(file.buffer, {
    resource_type: resourceType,
    folder: `cloudvault/${userId}`,
  });

  // Snapshot current file as a version.
  const nextVersion = await fileVersionsModel.getNextVersionNumber(fileId);
  await fileVersionsModel.createVersion({
    file_id: fileId,
    version_number: nextVersion,
    uploaded_by: userId,
    cloudinary_public_id: existing.cloudinary_public_id,
    cloudinary_url: existing.cloudinary_url,
    size_bytes: existing.size_bytes,
  });

  const updated = await fileModel.updateFileVersionData(fileId, {
    cloudinary_public_id: uploadResult.public_id,
    cloudinary_url: uploadResult.secure_url,
    size_bytes: file.size,
    mime_type: realMimeType,
  });

  await userModel.updateStorageUsed(userId, delta);
  await activityService.logUserActivity(userId, 'UPLOAD', 'file', fileId, {
    name: updated.original_name,
    version: true,
    versionNumber: nextVersion,
  });

  return updated;
};

const getFileVersions = async (fileId, userId, page = 1, limit = 20) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  await assertFileAccess(file, userId);

  const offset = (page - 1) * limit;
  return await fileVersionsModel.getVersionsByFileId(fileId, limit, offset);
};

const restoreVersion = async (fileId, versionId, userId) => {
  const file = await fileModel.getFileByIdAll(fileId);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  await assertFileAccess(file, userId, true);

  const version = await fileVersionsModel.getVersionById(versionId);
  if (!version || version.file_id !== fileId) {
    throw new ApiError(404, 'Version not found');
  }

  // Snapshot current state as a new version.
  const nextVersion = await fileVersionsModel.getNextVersionNumber(fileId);
  await fileVersionsModel.createVersion({
    file_id: fileId,
    version_number: nextVersion,
    uploaded_by: userId,
    cloudinary_public_id: file.cloudinary_public_id,
    cloudinary_url: file.cloudinary_url,
    size_bytes: file.size_bytes,
  });

  const delta = version.size_bytes - file.size_bytes;
  const restored = await fileModel.updateFileVersionData(fileId, {
    cloudinary_public_id: version.cloudinary_public_id,
    cloudinary_url: version.cloudinary_url,
    size_bytes: version.size_bytes,
    mime_type: file.mime_type,
  });

  // Remove the restored version row since it is now the current file.
  await fileVersionsModel.deleteVersion(versionId);

  await userModel.updateStorageUsed(userId, delta);
  await activityService.logUserActivity(userId, 'RESTORE', 'file', fileId, {
    name: restored.original_name,
    version: true,
    versionNumber: version.version_number,
  });

  return restored;
};

const getRecentFiles = async (ownerId) => {
  const [uploaded, modified, accessed] = await Promise.all([
    fileModel.getRecentUploaded(ownerId, 10),
    fileModel.getRecentModified(ownerId, 10),
    fileModel.getRecentAccessed(ownerId, 10),
  ]);

  return { uploaded, modified, accessed };
};

// One-off repair: re-detects real MIME type from actual file content for every
// existing file record, and fixes the DB row if it's mismatched.
const fixAllMimeTypes = async (apply = false) => {
  const { rows: files } = await db.query(
    'SELECT id, original_name, extension, mime_type, cloudinary_url FROM files WHERE deleted_at IS NULL'
  );

  const results = {
    checked: 0,
    mismatched: 0,
    updated: 0,
    failed: 0,
    details: [],
  };

  for (const file of files) {
    results.checked += 1;
    try {
      const buffer = await downloadBuffer(file.cloudinary_url);
      const detected = await fileTypeFromBuffer(buffer);
      const detectedMime = detected?.mime || null;
      const detectedExt = detected?.ext || getExtensionFromName(file.original_name);

      if (!detectedMime) {
        results.details.push({ id: file.id, name: file.original_name, status: 'skipped-undetected' });
        continue;
      }

      if (detectedMime !== file.mime_type) {
        results.mismatched += 1;
        const entry = {
          id: file.id,
          name: file.original_name,
          stored: file.mime_type,
          detected: detectedMime,
          status: apply ? 'updated' : 'would-update',
        };

        if (apply) {
          await db.query(
            'UPDATE files SET mime_type = $1, extension = $2 WHERE id = $3',
            [detectedMime, detectedExt, file.id]
          );
          results.updated += 1;
        }

        results.details.push(entry);
      }
    } catch (err) {
      results.failed += 1;
      results.details.push({ id: file.id, name: file.original_name, status: 'error', error: err.message });
    }
  }

  return results;
};

// One-off repair: recalculates storage_used_bytes for every user from the
// real sum of their non-deleted files, and fixes any drifted/negative values.
// apply=false -> dry run, only reports what would change.
// apply=true  -> actually updates mismatched rows.
const reconcileStorage = async (apply = false) => {
  const { rows: users } = await db.query(
    `SELECT u.id, u.email, u.storage_used_bytes AS stored_value,
            COALESCE(SUM(f.size_bytes), 0) AS actual_sum
     FROM users u
     LEFT JOIN files f ON f.owner_id = u.id AND f.deleted_at IS NULL
     GROUP BY u.id, u.email, u.storage_used_bytes`
  );

  const results = {
    checked: 0,
    mismatched: 0,
    updated: 0,
    details: [],
  };

  for (const u of users) {
    results.checked += 1;
    const stored = Number(u.stored_value);
    const actual = Number(u.actual_sum);

    if (stored !== actual) {
      results.mismatched += 1;
      const entry = {
        id: u.id,
        email: u.email,
        stored,
        actual,
        status: apply ? 'updated' : 'would-update',
      };

      if (apply) {
        await db.query('UPDATE users SET storage_used_bytes = $1 WHERE id = $2', [actual, u.id]);
        results.updated += 1;
      }

      results.details.push(entry);
    }
  }

  return results;
};

module.exports = {
  uploadFile,
  getFiles,
  searchFiles,
  renameFile,
  deleteFile,
  restoreFile,
  permanentDeleteFile,
  getTrashFiles,
  previewFile,
  downloadFile,
  getFileForStream,
  makeCopy,
  starFile,
  unstarFile,
  getStarredFiles,
  uploadNewVersion,
  getFileVersions,
  restoreVersion,
  getRecentFiles,
  fixAllMimeTypes,
  reconcileStorage,
};