const authService = require('../services/auth.service');
const { cookieOptions } = require('../utils/jwt.utils');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const user = await authService.registerUser({ name, email, password });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const { accessToken, refreshToken, user } = await authService.loginUser({
      email,
      password,
    });

    // Send refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Send access token in response body (frontend stores in memory)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,   // frontend keeps this in memory (not localStorage!)
        user,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    // Read refresh token from cookie (not request body!)
    const incomingRefreshToken = req.cookies?.refreshToken;

    const { accessToken } = await authService.refreshAccessToken(
      incomingRefreshToken
    );

    res.status(200).json({
      success: true,
      message: 'Access token refreshed',
      data: { accessToken },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    // req.user is set by auth middleware
    await authService.logoutUser(req.user.id);

    // Clear the cookie from browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, refreshToken, logout };