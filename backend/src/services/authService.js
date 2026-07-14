const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

const userModel = require('../models/userModel');
const tokenModel = require('../models/tokenModel');

const {
  sendVerificationEmail,
  sendPasswordResetEmail
} = require('./emailService');


// Generate JWT Tokens
const generateTokens = (id) => {

  const accessToken = jwt.sign(
    { id },
    env.JWT_ACCESS_SECRET || 'testsecret',
    {
      expiresIn: env.JWT_ACCESS_EXPIRY || '15m'
    }
  );


  const refreshToken = jwt.sign(
    { id },
    env.JWT_REFRESH_SECRET || 'testrefresh',
    {
      expiresIn: env.JWT_REFRESH_EXPIRY || '7d'
    }
  );


  return {
    accessToken,
    refreshToken
  };
};



// REGISTER USER
const registerUser = async (name, email, password) => {

  const existingUser = await userModel.findByEmail(email);


  if (existingUser) {
    throw ApiError.conflict('User already exists');
  }


  const salt = await bcrypt.genSalt(10);

  const passwordHash = await bcrypt.hash(
    password,
    salt
  );


  const user = await userModel.createUser(
    name,
    email,
    passwordHash
  );


  // Email Verification Token

  const verifyToken =
    crypto.randomBytes(32).toString('hex');


  const verifyTokenHash =
    crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');


  const expiresAt =
    new Date(Date.now() + 24 * 60 * 60 * 1000);



  await tokenModel.createEmailVerificationToken(
    user.id,
    verifyTokenHash,
    expiresAt
  );


  try {

    await sendVerificationEmail(
      user.email,
      verifyToken
    );

  } catch (error) {

    console.log(
      "Email sending failed:",
      error.message
    );

  }


  return user;
};




// LOGIN USER

const loginUser = async (email, password) => {


  const user =
    await userModel.findByEmail(email);



  if (!user) {

    throw ApiError.unauthorized(
      'Invalid credentials'
    );

  }



  const isMatch =
    await bcrypt.compare(
      password,
      user.password_hash
    );



  if (!isMatch) {

    throw ApiError.unauthorized(
      'Invalid credentials'
    );

  }



  const {
    accessToken,
    refreshToken
  } =
    generateTokens(user.id);



  const refreshTokenHash =
    crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');



  await userModel.updateRefreshToken(
    user.id,
    refreshTokenHash
  );



  return {
    user,
    accessToken,
    refreshToken
  };

};





// LOGOUT USER

const logoutUser = async (userId) => {

  await userModel.updateRefreshToken(
    userId,
    null
  );

};







// REFRESH TOKEN

const refreshAccessToken = async (refreshToken) => {


  if (!refreshToken) {

    throw ApiError.unauthorized(
      'No refresh token provided'
    );

  }



  let decoded;


  try {

    decoded =
      jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET || 'testrefresh'
      );

  } catch(error) {

    throw ApiError.unauthorized(
      'Invalid refresh token'
    );

  }




  const user =
    await userModel.findById(decoded.id);



  if (
    !user ||
    !user.refresh_token_hash
  ) {

    throw ApiError.unauthorized(
      'Token invalid'
    );

  }




  const tokenHash =
    crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');




  if (
    tokenHash !== user.refresh_token_hash
  ) {

    throw ApiError.unauthorized(
      'Token mismatch'
    );

  }




  const tokens =
    generateTokens(user.id);



  const newHash =
    crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');



  await userModel.updateRefreshToken(
    user.id,
    newHash
  );



  return tokens;

};







// VERIFY EMAIL

const verifyEmail = async (token) => {


  const tokenHash =
    crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');



  const dbToken =
    await tokenModel.findEmailVerificationToken(
      tokenHash
    );



  if (!dbToken) {

    throw ApiError.badRequest(
      'Invalid or expired verification token'
    );

  }



  await userModel.verifyEmail(
    dbToken.user_id
  );



  await tokenModel.markEmailVerificationTokenAsUsed(
    dbToken.id
  );

};








// FORGOT PASSWORD

const forgotPassword = async (email) => {


  const user =
    await userModel.findByEmail(email);



  // Security: do not reveal user exists

  if (!user) {

    return;

  }




  const resetToken =
    crypto.randomBytes(32).toString('hex');



  const resetHash =
    crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');



  const expiresAt =
    new Date(
      Date.now() + 60 * 60 * 1000
    );



  await tokenModel.createPasswordResetToken(
    user.id,
    resetHash,
    expiresAt
  );



  try {

    await sendPasswordResetEmail(
      user.email,
      resetToken
    );

  } catch(error) {

    console.log(
      "Reset email failed:",
      error.message
    );

  }


};









// RESET PASSWORD

const resetPassword = async (
  token,
  newPassword
) => {



  const tokenHash =
    crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');



  const dbToken =
    await tokenModel.findPasswordResetToken(
      tokenHash
    );



  if (!dbToken) {

    throw ApiError.badRequest(
      'Invalid or expired reset token'
    );

  }



  const salt =
    await bcrypt.genSalt(10);



  const passwordHash =
    await bcrypt.hash(
      newPassword,
      salt
    );



  await userModel.updatePassword(
    dbToken.user_id,
    passwordHash
  );



  await tokenModel.markPasswordResetTokenAsUsed(
    dbToken.id
  );



  await userModel.updateRefreshToken(
    dbToken.user_id,
    null
  );

};









// CHANGE PASSWORD

const changePassword = async (
  userId,
  currentPassword,
  newPassword
) => {


  const user =
    await userModel.findById(userId);



  if (!user) {

    throw ApiError.notFound(
      'User not found'
    );

  }




  const match =
    await bcrypt.compare(
      currentPassword,
      user.password_hash
    );



  if (!match) {

    throw ApiError.unauthorized(
      'Current password incorrect'
    );

  }




  const salt =
    await bcrypt.genSalt(10);



  const passwordHash =
    await bcrypt.hash(
      newPassword,
      salt
    );



  await userModel.updatePassword(
    userId,
    passwordHash
  );



  await userModel.updateRefreshToken(
    userId,
    null
  );

};






module.exports = {

  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword

};