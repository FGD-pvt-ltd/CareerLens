const mongoose = require('mongoose');

const ResumeInfoSchema = new mongoose.Schema(
  {
    originalName: { type: String, default: '' },
    filename: { type: String, default: '' }, // Unique internal identifier (not full filesystem path)
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: 'application/pdf' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CodingProfileSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true }, // e.g. leetcode, codeforces, hackerrank
    url: { type: String, required: true },
  },
  { _id: false }
);

const EducationSchema = new mongoose.Schema(
  {
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    fieldOfStudy: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    gpa: { type: String, default: '' },
  },
  { _id: false }
);

const ExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: '' },
    title: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    repositoryUrl: { type: String, default: '' },
    liveUrl: { type: String, default: '' },
    techStack: [{ type: String }],
  },
  { _id: false }
);

const CandidateProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    resume: ResumeInfoSchema,
    resumeText: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    codingProfiles: [CodingProfileSchema],
    portfolioUrl: {
      type: String,
      default: '',
      trim: true,
    },
    professionalProfileUrl: {
      type: String,
      default: '',
      trim: true,
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
    education: [EducationSchema],
    experience: [ExperienceSchema],
    projects: [ProjectSchema],
    extractedSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    claimedSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    analysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
