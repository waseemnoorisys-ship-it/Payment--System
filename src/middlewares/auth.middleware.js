const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    // Header format: "Bearer eyJhbGci..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1]; // extract token after "Bearer "

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 3. Find user and attach to request
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    req.user = user; // now any route after this can use req.user
    next();          // pass control to the actual route handler

  } catch (error) {
    // jwt.verify throws if token is expired or invalid
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    });
  }
};

module.exports = { protect };