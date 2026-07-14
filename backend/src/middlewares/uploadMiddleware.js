const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Store files in memory so they can be processed or uploaded to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Not an image! Please upload only images.'), false);
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadFiles = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit per file
  },
});

module.exports = { uploadAvatar, uploadFiles };
