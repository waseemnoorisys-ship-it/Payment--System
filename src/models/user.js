const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,              // removes extra spaces
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,            // no two users with same email
      lowercase: true,         // saves as "user@gmail.com" not "User@Gmail.com"
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,           // ⚠️ NEVER returned in queries by default
    },

    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',         // reference to Course model
      },
    ],

    refreshToken: {
      type: String,
      select: false,           // never expose this in API responses
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,          // adds createdAt and updatedAt automatically
  }
);

// ─── Hash password BEFORE saving to DB ───────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password was changed (not on profile updates)
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: compare entered password with hashed password ───────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);