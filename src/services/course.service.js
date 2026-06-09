const Course = require('../models/course.model');
const User = require('../models/User.model')

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


//check the user is accesable to course or not [what we need : 1) user_id 2) re.params === course name [web,devops,cyber security etc]]
const checkCourseAccess = async (userId, courseId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const hasAccess = user.enrolledCourses.some(
    (id) => id.toString() === courseId.toString()
  );

  return { hasAccess };
};

//after checking get the course that a user is enrolled what we need [ user_id : for specific details of it]

const getEnrolledCourses = async (userId) => {
  const user = await User.findById(userId)
    .populate('enrolledCourses', 'title description instructor duration level thumbnail');

  if (!user) throw new Error('User not found');
  return user.enrolledCourses;
};
module.exports = { getAllCourses, getCourseById ,checkCourseAccess ,getEnrolledCourses};