const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  };
}

async function register({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists');
  }

  const hashed = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const user = await User.create({ name, email: email.toLowerCase(), password: hashed });

  const token = signToken(user);
  return { token, user: sanitizeUser(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user);
  return { token, user: sanitizeUser(user) };
}

async function updateProfile(userId, { name }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (name !== undefined) {
    user.name = name;
  }
  await user.save();
  return sanitizeUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect');
  }

  user.password = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await user.save();
}

module.exports = { AppError, register, login, sanitizeUser, updateProfile, changePassword };
