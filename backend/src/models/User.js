const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'placement_officer'],
      default: 'student',
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
