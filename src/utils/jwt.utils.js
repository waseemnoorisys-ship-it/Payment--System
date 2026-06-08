const jwt = require('jsonwebtoken');

// ─── Generate Access Token (short-lived) ─────────────────────────────────────
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },                          // payload — what we store in token
    process.env.JWT_ACCESS_SECRET,           // secret key
    { expiresIn: '15m' }                     // expires in 15 minutes
  );
};

// ─── Generate Refresh Token (long-lived) ─────────────────────────────────────
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,          // DIFFERENT secret for refresh
    { expiresIn: '7d' }
  );
};

// ─── Cookie options ───────────────────────────────────────────────────────────
const cookieOptions = {
  httpOnly: true,       // JS cannot read this cookie (blocks XSS attacks)
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',   // blocks CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  cookieOptions,
};