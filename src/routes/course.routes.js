const express = require('express');
const router = express.Router();
const {
  getEnrolledCourses,
  getAllCourses,
  getCourseById,
  checkAccess,
  
} = require('../controllers/course.controller');
const { protect } = require('../middlewares/auth.middleware');

// Public routes — no login required to browse courses
router.get('/enrolled/me', protect, getEnrolledCourses); // add BEFORE /:id
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.get('/:id/access', protect, checkAccess); // add this

module.exports = router;