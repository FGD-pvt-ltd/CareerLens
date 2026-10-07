const mongoose = require('mongoose');

const AnalysisResultSchema = new mongoose.Schema(
  {
    readinessScore: {
      type: Number,
      default: null, // Null indicates pending AI analysis / non-invented score
    },
    scoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    skills: {
      type: Array,
      default: () => [],
    },
    strengths: {
      type: Array,
      default: () => [],
    },
    gaps: {
      type: Array,
      default: () => [],
    },
    roadmap: {
      type: Array,
      default: () => [],
    },
  },
  { _id: false }
);

const AIMetadataSchema = new mongoose.Schema(
  {
    serviceVersion: {
      type: String,
      default: '',
    },
    model: {
      type: String,
      default: '',
    },
    analyzedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const TargetRoleSchema = new mongoose.Schema(
  {
    roleId: {
      type: String,
      default: '',
      trim: true,
    },
    roleName: {
      type: String,
      default: '',
      trim: true,
    },
    slug: {
      type: String,
      default: '',
      trim: true,
    },
    requirements: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

const AnalysisSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    targetRole: {
      type: TargetRoleSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: '{VALUE} is not a valid analysis status. Must be pending, processing, completed, or failed.',
      },
      default: 'pending',
      index: true,
    },
    result: {
      type: AnalysisResultSchema,
      default: () => ({}),
    },
    aiMetadata: {
      type: AIMetadataSchema,
      default: () => ({}),
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Backward-compatibility alias virtuals
AnalysisSchema.virtual('candidate').get(function () {
  return this.candidateId;
});

AnalysisSchema.virtual('analysisStatus').get(function () {
  return this.status;
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
