const User = require('../models/User.model');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt.utils');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const registerUser = async ({ name, email, password }) => {
  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // 2. Create user — password is hashed by the pre('save') hook automatically
  const user = await User.create({ name, email, password });

  // 3. Return safe user object (no password, no refreshToken)
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
  // 1. Find user — must explicitly select password (select: false in schema)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // 2. Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid email or password'); // same message — no hints to attacker
  }

  // 3. Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // 4. Save refresh token in DB (so we can invalidate on logout)
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false }); // skip validation on partial update

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new Error('No refresh token provided');
  }

  // 1. Verify the token is valid and not expired
  const jwt = require('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired refresh token. Please login again.');
  }

  // 2. Find user and check their stored refresh token matches
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new Error('Refresh token mismatch. Please login again.');
  }

  // 3. Issue new access token
  const newAccessToken = generateAccessToken(user._id);

  return { accessToken: newAccessToken };
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
const logoutUser = async (userId) => {
  // Remove refresh token from DB — invalidates it immediately
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};