const cloudinary = require('../config/cloudinary');

const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

const deleteFromCloudinary = async (public_id, resource_type = 'image') => {
  if (!public_id) return;
  await cloudinary.uploader.destroy(public_id, { resource_type });
};

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
