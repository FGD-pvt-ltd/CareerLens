const mongoose = require('mongoose');

const SkillGapSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    importance: { type: String, enum: ['critical', 'recommended', 'optional'], default: 'critical' },
    currentStatus: { type: String, default: 'missing' },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const AnalysisSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    targetRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRole',
    },
    targetRoleName: {
      type: String,
      default: '',
      trim: true,
    },
    readinessScore: {
      type: Number,
      default: null, // Null indicates pending AI analysis / non-invented score
    },
    technicalScore: {
      type: Number,
      default: null,
    },
    projectScore: {
      type: Number,
      default: null,
    },
    evidenceScore: {
      type: Number,
      default: null,
    },
    roleAlignmentScore: {
      type: Number,
      default: null,
    },
    consistencyScore: {
      type: Number,
      default: null,
    },
    verifiedStrengths: [
      {
        type: String,
      },
    ],
    skillGaps: [SkillGapSchema],
    recommendations: [
      {
        type: String,
      },
    ],
    roadmap: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    analysisStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    evidenceReferences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', AnalysisSchema);
