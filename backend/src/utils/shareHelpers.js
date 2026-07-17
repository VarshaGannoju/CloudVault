const crypto = require('crypto');

const TOKEN_BYTES = 32;
const TOKEN_REGEX = /^[a-f0-9]{64}$/;

const generatePublicToken = () => crypto.randomBytes(TOKEN_BYTES).toString('hex');

const isValidPublicToken = (token) => {
  return typeof token === 'string' && TOKEN_REGEX.test(token);
};

const sanitizePublicFileShare = (share) => ({
  type: 'file',
  name: share.original_name,
  mimeType: share.mime_type,
  sizeBytes: share.size_bytes,
  allowDownload: share.allow_download,
  views: share.views,
  expiresAt: share.expires_at,
  cloudinaryUrl: share.cloudinary_url,
});

const sanitizePublicFolderShare = (share, contents) => ({
  type: 'folder',
  name: share.name,
  allowDownload: share.allow_download,
  views: share.views,
  expiresAt: share.expires_at,
  contents: {
    files: (contents?.files || []).map((f) => ({
      id: f.id,
      name: f.original_name,
      mimeType: f.mime_type,
      sizeBytes: f.size_bytes,
      downloadUrl: f.cloudinary_url,
    })),
    folders: (contents?.folders || []).map((f) => ({
      name: f.name,
    })),
  },
});

module.exports = {
  generatePublicToken,
  isValidPublicToken,
  sanitizePublicFileShare,
  sanitizePublicFolderShare,
};
