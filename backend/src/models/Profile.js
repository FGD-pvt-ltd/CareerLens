const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    githubUsername: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    portfolioUrl: {
      type: String,
      trim: true,
    },
    resumePath: {
      type: String,
    },
    claimedSkills: [
      {
        name: String,
        category: {
          type: String,
          enum: ['technical', 'soft'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);
