const courseService = require('../services/course.service');

// ─── GET /api/courses ──────────────────────────────────────────────────────
const getAllCourses = async (req, res) => {
  try {
    // Pass query params directly to service
    // e.g. ?category=web&level=beginner&search=node&page=1&limit=5
    const result = await courseService.getAllCourses(req.query);

    res.status(200).json({
      success: true,
      message: 'Courses fetched successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/courses/:id ──────────────────────────────────────────────────
const getCourseById = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course fetched successfully',
      data: { course },
    });
  } catch (error) {
    const status = error.message === 'Course not found' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getAllCourses, getCourseById };