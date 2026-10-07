const mongoose = require('mongoose');

const RequiredSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    weight: { type: Number, default: 1.0 },
    importance: {
      type: String,
      enum: ['critical', 'recommended', 'optional'],
      default: 'critical',
    },
  },
  { _id: false }
);

const PreferredSkillSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true, trim: true },
    weight: { type: Number, default: 0.5 },
  },
  { _id: false }
);

const JobRoleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: 'Engineering',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    requiredSkills: [RequiredSkillSchema],
    preferredSkills: [PreferredSkillSchema],
    skillWeights: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobRole', JobRoleSchema);
