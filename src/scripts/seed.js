require('dotenv').config(); // load .env variables
const mongoose = require('mongoose');
const Course = require('../models/Course.model');
const connectDB = require('../config/db');

const courses = [
  {
    title: 'Complete Node.js Backend Bootcamp',
    description:
      'Learn Node.js, Express, MongoDB and build real-world REST APIs from scratch.',
    price: 1999,
    instructor: 'Rohan Verma',
    category: 'web',
    level: 'beginner',
    duration: '18 hours',
  },
  {
    title: 'React.js for Beginners',
    description:
      'Master React hooks, state management, and build modern UIs with real projects.',
    price: 1499,
    instructor: 'Priya Mehta',
    category: 'web',
    level: 'beginner',
    duration: '14 hours',
  },
  {
    title: 'Full Stack MERN Development',
    description:
      'MongoDB, Express, React, Node.js — build complete full-stack applications.',
    price: 2999,
    instructor: 'Arjun Singh',
    category: 'web',
    level: 'intermediate',
    duration: '30 hours',
  },
  {
    title: 'Python for Data Science',
    description:
      'Learn Python, Pandas, NumPy and data visualisation with real datasets.',
    price: 2499,
    instructor: 'Neha Kapoor',
    category: 'data-science',
    level: 'beginner',
    duration: '22 hours',
  },
  {
    title: 'DevOps with Docker and Kubernetes',
    description:
      'Containers, orchestration, CI/CD pipelines — everything DevOps from zero.',
    price: 3499,
    instructor: 'Vikram Das',
    category: 'devops',
    level: 'advanced',
    duration: '26 hours',
  },
];

const seedDB = async () => {
  try {
    await connectDB();

    // Delete existing courses first (clean slate)
    await Course.deleteMany({});
    console.log('Old courses deleted');

    // Insert new courses
    const created = await Course.insertMany(courses);
    console.log(`${created.length} courses seeded successfully`);

    // Print each course id — useful for testing buy API later
    created.forEach((c) => console.log(`  ${c.title} → ID: ${c._id}`));

    process.exit(0); // success
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1); // failure
  }
};

seedDB();