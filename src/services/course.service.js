const Course = require('../models/course.model');

// ─── Get all published courses ─────────────────────────────────────────────
const getAllCourses = async (query = {}) => {
  const {
    category,
    level,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = query;

  // Build filter object dynamically
  const filter = { isPublished: true }; // always only show published courses

  if (category) filter.category = category;
  if (level) filter.level = level;

  if (search) {
    // Case-insensitive search on title or instructor
    filter.$or = [
      { title:      { $regex: search, $options: 'i' } },
      { instructor: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination math
  const skip = (Number(page) - 1) * Number(limit);

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit)),
    Course.countDocuments(filter),
  ]);

  return {
    courses,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// ─── Get single course by ID ───────────────────────────────────────────────
const getCourseById = async (courseId) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  if (!course.isPublished) {
    throw new Error('This course is not available');
  }

  return course;
};

module.exports = { getAllCourses, getCourseById };