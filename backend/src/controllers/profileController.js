const profileService = require('../services/profileService');
const asyncHandler = require('../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const user = await profileService.getProfile(req.user.id);
  
  // Exclude sensitive fields before sending
  const { password_hash: _password_hash, refresh_token_hash: _refresh_token_hash, ...safeUser } = user;
  
  res.status(200).json({
    success: true,
    data: safeUser,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await profileService.updateProfile(req.user.id, name);
  
  const { password_hash: _password_hash, refresh_token_hash: _refresh_token_hash, ...safeUser } = user;

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: safeUser,
  });
});

const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await profileService.uploadAvatar(req.user.id, req.file.buffer);

  const { password_hash: _password_hash, refresh_token_hash: _refresh_token_hash, ...safeUser } = user;

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: safeUser,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
};
