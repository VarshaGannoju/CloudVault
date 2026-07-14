const cloudinary = require('../config/cloudinary');

const { env } = require('../config/env');

const uploadBufferToCloudinary = (buffer, options = {}) => {
  if (!env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY === 'your_api_key') {
    console.warn('NOTE: Cloudinary API key is not configured. Mocking file upload.');
    return Promise.resolve({
      secure_url: 'data:text/plain;base64,VGhpcyBpcyBhIG1vY2sgZmlsZSB1cGxvYWRlZCBsb2NhbGx5IHdpdGhvdXQgQ2xvdWRpbmFyeSBjcmVkZW50aWFscy4=',
      public_id: 'mock_public_id_' + Date.now(),
      format: 'txt',
      resource_type: 'raw',
    });
  }

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
  if (!public_id || public_id.startsWith('mock_public_id_')) return;
  await cloudinary.uploader.destroy(public_id, { resource_type });
};

module.exports = {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
