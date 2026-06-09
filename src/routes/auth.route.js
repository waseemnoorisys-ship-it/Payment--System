const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getProfile); // add this line for geting my profile details
router.post('/logout', protect, logout); // must be logged in to logout

module.exports = router;