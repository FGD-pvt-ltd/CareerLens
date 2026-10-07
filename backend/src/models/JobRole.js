const mongoose = require('mongoose');

const jobRoleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    requiredSkills: [
      {
        skill: String,
        weight: Number,
        importance: {
          type: String,
          enum: ['critical', 'recommended', 'optional'],
          default: 'recommended',
        },
      },
    ],
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior'],
      default: 'entry',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('JobRole', jobRoleSchema);
