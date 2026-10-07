const mongoose = require('mongoose');

const EvidenceSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      enum: ['resume', 'github', 'coding_profile', 'portfolio', 'certification', 'assessment'],
      required: true,
      index: true,
    },
    sourceUrl: {
      type: String,
      default: '',
      trim: true,
    },
    candidateProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CandidateProfile',
      required: true,
      index: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    },
    skillName: {
      type: String,
      default: '',
      trim: true,
    },
    evidenceDescription: {
      type: String,
      default: '',
    },
    evidenceStrength: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evidence', EvidenceSchema);
