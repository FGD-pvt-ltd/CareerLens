const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobRole',
    },
    readinessScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    skillScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    evidenceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    verifiedSkills: [
      {
        skill: String,
        confidence: Number,
        evidenceSources: [String],
      },
    ],
    missingSkills: [String],
    roadmap: [
      {
        step: Number,
        title: String,
        description: String,
        resources: [String],
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Analysis', analysisSchema);
