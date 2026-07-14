const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');
const userModel = require('../models/userModel');
const tokenModel = require('../models/tokenModel');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, env.JWT_ACCESS_SECRET || 'testsecret', { expiresIn: env.JWT_ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ id }, env.JWT_REFRESH_SECRET || 'testrefresh', { expiresIn: env.JWT_REFRESH_EXPIRY });
  return { accessToken, refreshToken };
};

const registerUser = async (name, email, password) => {
  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new ApiError(400, 'User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await userModel.createUser(name, email, passwordHash);

  // Generate Email Verification Token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await tokenModel.createEmailVerificationToken(user.id, verifyTokenHash, expiresAt);
  await sendVerificationEmail(user.email, verifyToken);

  return user;
};

const loginUser = async (email, password) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = generateTokens(user.id);

  // Hash refresh token for DB storage
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await userModel.updateRefreshToken(user.id, refreshTokenHash);

  return { user, accessToken, refreshToken };
};

const logoutUser = async (userId) => {
  await userModel.updateRefreshToken(userId, null);
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET || 'testrefresh');
  } catch {
    throw new ApiError(401, 'Not authorized, token failed');
  }

  const user = await userModel.findById(decoded.id);
  if (!user || !user.refresh_token_hash) {
    throw new ApiError(401, 'Not authorized, token invalid');
  }

  const providedTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  if (providedTokenHash !== user.refresh_token_hash) {
    throw new ApiError(401, 'Not authorized, token mismatch');
  }

  const tokens = generateTokens(user.id);
  const newRefreshTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
  
  await userModel.updateRefreshToken(user.id, newRefreshTokenHash);

  return tokens;
};

const verifyEmail = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const dbToken = await tokenModel.findEmailVerificationToken(tokenHash);

  if (!dbToken) {
    throw new ApiError(400, 'Invalid or expired token');
  }

  await userModel.verifyEmail(dbToken.user_id);
  await tokenModel.markEmailVerificationTokenAsUsed(dbToken.id);
};

const forgotPassword = async (email) => {
  const user = await userModel.findByEmail(email);
  if (!user) {
    return; // Don't throw error to prevent email enumeration
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await tokenModel.createPasswordResetToken(user.id, resetTokenHash, expiresAt);
  await sendPasswordResetEmail(user.email, resetToken);
};

const resetPassword = async (token, newPassword) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const dbToken = await tokenModel.findPasswordResetToken(tokenHash);

  if (!dbToken) {
    throw new ApiError(400, 'Invalid or expired token');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await userModel.updatePassword(dbToken.user_id, passwordHash);
  await tokenModel.markPasswordResetTokenAsUsed(dbToken.id);
  // Optional: Invalidate existing refresh tokens by setting it to null
  await userModel.updateRefreshToken(dbToken.user_id, null);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await userModel.findById(userId);

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await userModel.updatePassword(userId, passwordHash);
  // Optional: Invalidate other sessions
  await userModel.updateRefreshToken(userId, null);
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
};
