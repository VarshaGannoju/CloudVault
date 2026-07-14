const nodemailer = require('nodemailer');
const { env } = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const sendEmail = async (options) => {
  if (env.NODE_ENV === 'test') {
    return; // Don't send real emails in test environment
  }

  const mailOptions = {
    from: `CloudVault <${env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  
  const message = `Please click the following link to verify your email: \n\n ${verifyUrl}`;
  const html = `<p>Please click the following link to verify your email:</p> <a href="${verifyUrl}">Verify Email</a>`;

  await sendEmail({
    email,
    subject: 'CloudVault - Email Verification',
    message,
    html,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  
  const message = `Please click the following link to reset your password: \n\n ${resetUrl}\n\nIf you did not request this, please ignore this email.`;
  const html = `<p>Please click the following link to reset your password:</p> <a href="${resetUrl}">Reset Password</a><p>If you did not request this, please ignore this email.</p>`;

  await sendEmail({
    email,
    subject: 'CloudVault - Password Reset',
    message,
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
