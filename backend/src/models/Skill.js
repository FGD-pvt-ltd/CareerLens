const mongoose = require('mongoose');

const SourceReferenceSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ['resume', 'github', 'coding_profile', 'portfolio', 'certification', 'assessment'],
      required: true,
    },
    referenceUrl: { type: String, default: '' },
    snippet: { type: String, default: '' },
  },
  { _id: false }
);

const SkillSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: 'technical',
      trim: true,
    },
    claimed: {
      type: Boolean,
      default: true,
    },
    sourceReferences: [SourceReferenceSchema],
    evidenceReferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
      },
    ],
    evidenceStrength: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'none',
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
    skillScore: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['verified', 'partially_verified', 'unverified', 'not_found'],
      default: 'unverified',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Skill', SkillSchema);
