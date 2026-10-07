const mongoose = require('mongoose');
const { calculateProfileCompleteness } = require('../utils/completenessCalculator');

// Helper URL validator for optional fields
const isValidUrl = (val) => {
  if (!val || typeof val !== 'string' || val.trim() === '') return true;
  try {
    const url = new URL(val.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Helper email validator for optional fields
const isValidEmail = (val) => {
  if (!val || typeof val !== 'string' || val.trim() === '') return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
};

const BasicInfoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required in basicInfo.name'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: isValidEmail,
        message: 'Invalid email format provided in basicInfo.email',
      },
    },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    headline: { type: String, trim: true },
    profilePhotoUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for profilePhotoUrl',
      },
    },
  },
  { _id: false }
);

const CollegeSchema = new mongoose.Schema(
  {
    collegeName: { type: String, trim: true },
    name: { type: String, trim: true }, // backward compatibility
    university: { type: String, trim: true },
    degree: { type: String, trim: true },
    branch: { type: String, trim: true },
    specialization: { type: String, trim: true },
    yearOfStudy: { type: String, trim: true },
    graduationYear: {
      type: Number,
      validate: {
        validator: (v) => v == null || (Number.isInteger(v) && v >= 1970 && v <= 2100),
        message: 'graduationYear must be a valid 4-digit year (1970-2100)',
      },
    },
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    relevantCoursework: [{ type: String, trim: true }],
    academicAchievements: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }], // backward compatibility
  },
  { _id: false }
);

const EducationSchema = new mongoose.Schema(
  {
    level: { type: String, trim: true }, // school, diploma, undergraduate, postgraduate
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    field: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
  },
  { _id: false }
);

const ExperienceSchema = new mongoose.Schema(
  {
    organization: { type: String, trim: true },
    role: { type: String, trim: true },
    employmentType: { type: String, trim: true }, // internship, part-time, full-time, research, freelance
    location: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
    technologies: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }],
    source: { type: String, trim: true, default: 'user_input' },
  },
  { _id: false }
);

const SkillItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    category: { type: String, trim: true },
    source: { type: String, trim: true, default: 'user_input' },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Project name is required'] },
    description: { type: String, trim: true },
    technologies: [{ type: String, trim: true }],
    category: { type: String, trim: true },
    role: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    githubUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for project githubUrl',
      },
    },
    liveUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for project liveUrl',
      },
    },
    demoUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for project demoUrl',
      },
    },
    teamSize: { type: Number, default: 1 },
    source: { type: String, trim: true, default: 'user_input' },
  },
  { _id: false }
);

const CertificationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Certification name is required'] },
    issuingOrganization: { type: String, trim: true },
    issuer: { type: String, trim: true }, // backward compatibility
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true },
    credentialUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for certification credentialUrl',
      },
    },
    certificateFileReference: { type: String, trim: true },
    source: { type: String, trim: true, default: 'user_input' },
  },
  { _id: false }
);

const AcademicAchievementSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: [true, 'Academic achievement title is required'] },
    description: { type: String, trim: true },
    date: { type: Date },
    organization: { type: String, trim: true },
    credentialUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for academic achievement credentialUrl',
      },
    },
    source: { type: String, trim: true, default: 'user_input' },
  },
  { _id: false }
);

const AchievementSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: [true, 'Achievement title is required'] },
    description: { type: String, trim: true },
    category: {
      type: String,
      trim: true,
      enum: {
        values: ['hackathon', 'coding contest', 'club', 'leadership', 'volunteering', 'competition', 'publication', 'other'],
        message: '{VALUE} is not a valid achievement category',
      },
      default: 'other',
    },
    date: { type: Date },
    organization: { type: String, trim: true },
    source: { type: String, trim: true, default: 'user_input' },
  },
  { _id: false }
);

const CodingProfileStatsSchema = new mongoose.Schema(
  {
    problemsSolved: { type: Number, default: null },
    rating: { type: Number, default: null },
    rank: { type: Number, default: null },
    contestsParticipated: { type: Number, default: null },
  },
  { _id: false }
);

const CodingProfileProblemBreakdownSchema = new mongoose.Schema(
  {
    easy: { type: Number, default: null },
    medium: { type: Number, default: null },
    hard: { type: Number, default: null },
  },
  { _id: false }
);

const CodingProfileActivitySchema = new mongoose.Schema(
  {
    lastActiveDate: { type: Date, default: null },
  },
  { _id: false }
);

const CodingProfileSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: [true, 'Platform is required for coding profile'],
      enum: {
        values: ['leetcode', 'codeforces', 'codechef', 'hackerrank', 'geeksforgeeks'],
        message: '{VALUE} is not a supported coding platform.',
      },
      lowercase: true,
      trim: true,
    },
    username: { type: String, trim: true, default: null },
    profileUrl: {
      type: String,
      required: [true, 'profileUrl is required for coding profile'],
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for coding profile profileUrl',
      },
    },
    stats: {
      type: CodingProfileStatsSchema,
      default: () => ({}),
    },
    problemBreakdown: {
      type: CodingProfileProblemBreakdownSchema,
      default: () => ({}),
    },
    languages: [{ type: String, trim: true }],
    activity: {
      type: CodingProfileActivitySchema,
      default: () => ({}),
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    dataSource: {
      type: String,
      enum: ['official_api', 'public_endpoint', 'user_provided', 'unavailable'],
      default: 'user_provided',
    },
    fetchStatus: {
      type: String,
      enum: ['pending', 'completed', 'partial', 'unavailable', 'failed'],
      default: 'pending',
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ProfessionalProfileSchema = new mongoose.Schema(
  {
    platform: { type: String, trim: true, required: [true, 'Platform is required for professional profile'] },
    profileUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for professional profile url',
      },
    },
    url: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for professional profile url',
      },
    }, // backward compatibility
    username: { type: String, trim: true },
    displayName: { type: String, trim: true },
    fetchedData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    fetchStatus: {
      type: String,
      enum: ['pending', 'completed', 'partial', 'unavailable', 'failed', 'user_provided'],
      default: 'user_provided',
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    source: { type: String, default: 'user_provided' },
  },
  { _id: false }
);

const PortfolioSchema = new mongoose.Schema(
  {
    platform: { type: String, trim: true },
    url: {
      type: String,
      trim: true,
      required: [true, 'Portfolio URL is required'],
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for portfolio url',
      },
    },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    type: { type: String, trim: true },
    fetchedData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    fetchStatus: {
      type: String,
      enum: ['pending', 'completed', 'partial', 'unavailable', 'failed', 'user_provided'],
      default: 'user_provided',
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
    source: { type: String, default: 'user_provided' },
  },
  { _id: false }
);

const GithubRepositorySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    fullName: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    url: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for repository url',
      },
    },
    homepage: { type: String, trim: true, default: '' },
    primaryLanguage: { type: String, trim: true, default: null },
    languages: [{ type: String, trim: true }],
    topics: [{ type: String, trim: true }],
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    pushedAt: { type: Date },
    defaultBranch: { type: String, default: 'main' },
    archived: { type: Boolean, default: false },
    fork: { type: Boolean, default: false },
    readme: { type: String, default: '' },
  },
  { _id: false }
);

const GithubActivitySchema = new mongoose.Schema(
  {
    lastActiveDate: { type: Date, default: null },
    recentRepositoryCount: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 },
  },
  { _id: false }
);

const GithubSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true },
    profileUrl: {
      type: String,
      trim: true,
      validate: {
        validator: isValidUrl,
        message: 'Invalid URL format for github profileUrl',
      },
    },
    name: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    publicRepositoryCount: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    accountCreatedAt: { type: Date, default: null },
    repositories: {
      type: [GithubRepositorySchema],
      default: [],
    },
    languageSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    activity: {
      type: GithubActivitySchema,
      default: () => ({}),
    },
    analyzedAt: { type: Date, default: null },
  },
  { _id: false }
);

const ResumeSchema = new mongoose.Schema(
  {
    fileName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    extractedText: { type: String },
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: {
        values: ['resume', 'cv'],
        message: '{VALUE} is not a valid documentType. Allowed values are "resume" or "cv".',
      },
      required: [true, 'documentType is required and must be either resume or cv'],
    },
    fileName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    fileSize: { type: Number },
    storagePath: { type: String, trim: true },
    extractedText: { type: String, default: '' },
    extractionStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const TargetRoleSchema = new mongoose.Schema(
  {
    roleId: { type: mongoose.Schema.Types.Mixed, default: null },
    roleName: { type: String, trim: true, default: null },
    slug: { type: String, trim: true, default: null },
  },
  { _id: false }
);

// Main CandidateProfile Schema
const CandidateProfileSchema = new mongoose.Schema(
  {
    basicInfo: {
      type: BasicInfoSchema,
      required: [true, 'basicInfo section is required'],
    },
    college: {
      type: CollegeSchema,
      default: () => ({}),
    },
    education: {
      type: [EducationSchema],
      default: [],
    },
    experience: {
      type: [ExperienceSchema],
      default: [],
    },
    skills: {
      type: [SkillItemSchema],
      default: [],
    },
    projects: {
      type: [ProjectSchema],
      default: [],
    },
    certifications: {
      type: [CertificationSchema],
      default: [],
    },
    academicAchievements: {
      type: [AcademicAchievementSchema],
      default: [],
    },
    achievements: {
      type: [AchievementSchema],
      default: [],
    },
    codingProfiles: {
      type: [CodingProfileSchema],
      default: [],
    },
    professionalProfiles: {
      type: [ProfessionalProfileSchema],
      default: [],
    },
    portfolios: {
      type: [PortfolioSchema],
      default: [],
    },
    github: {
      type: GithubSchema,
      default: () => ({}),
    },
    resume: {
      type: ResumeSchema,
      default: () => ({}),
    },
    documents: {
      type: [DocumentSchema],
      default: [],
    },
    targetRole: {
      type: TargetRoleSchema,
      default: () => ({}),
    },
    profileCompleteness: {
      type: Number,
      min: [0, 'Completeness cannot be negative'],
      max: [100, 'Completeness cannot exceed 100'],
      default: 0,
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Deterministic Profile Completeness pre-save hook
CandidateProfileSchema.pre('save', function (next) {
  const { score } = calculateProfileCompleteness(this);
  this.profileCompleteness = score;
  next();
});

// Let Mongoose manage collection: 'CandidateProfile' -> 'candidateprofiles'
const CandidateProfile = mongoose.model('CandidateProfile', CandidateProfileSchema);

module.exports = CandidateProfile;
