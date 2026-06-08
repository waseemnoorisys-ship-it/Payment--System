const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
    },

    thumbnail: {
      type: String,
      default: 'https://placehold.co/600x400?text=Course',
    },

    category: {
      type: String,
      enum: ['web', 'mobile', 'data-science', 'devops', 'design'],
      default: 'web',
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    duration: {
      type: String,         // e.g. "12 hours"
      default: 'N/A',
    },

    isPublished: {
      type: Boolean,
      default: true,        // only published courses shown to users
    },

    enrolledCount: {
      type: Number,
      default: 0,           // increments every time someone buys
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', courseSchema);