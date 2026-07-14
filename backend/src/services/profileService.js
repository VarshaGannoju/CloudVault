const userModel = require('../models/userModel');
const { uploadBufferToCloudinary } = require('../config/cloudinary');
const { ApiError } = require('../utils/ApiError');

const getProfile = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateProfile = async (userId, name) => {
  const updatedUser = await userModel.updateProfile(userId, name, null);
  return updatedUser;
};

const uploadAvatar = async (userId, fileBuffer) => {
  if (!fileBuffer) {
    throw new ApiError(400, 'No file provided');
  }

  // Upload to Cloudinary
  const result = await uploadBufferToCloudinary(fileBuffer, { folder: 'avatars' });
  
  // Update DB
  const updatedUser = await userModel.updateProfile(userId, null, result.secure_url);
  return updatedUser;
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
};
