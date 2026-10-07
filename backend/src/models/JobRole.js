const mongoose = require('mongoose');

const SkillRequirementSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'tools',
    },
    importance: {
      type: String,
      enum: ['core', 'important', 'optional'],
      default: 'core',
    },
    expectedLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
  },
  { _id: false }
);

const JobRoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Role slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Role category is required'],
      trim: true,
      default: 'Engineering',
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    requiredSkills: {
      type: [SkillRequirementSchema],
      default: [],
    },
    preferredSkills: {
      type: [SkillRequirementSchema],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    commonTechnologies: {
      type: [String],
      default: [],
    },
    relevantCertifications: {
      type: [String],
      default: [],
    },
    relevantCoursework: {
      type: [String],
      default: [],
    },
    experienceExpectations: {
      type: [String],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        // Provide roleName alias for seamless backward compatibility
        ret.roleName = ret.name;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.roleName = ret.name;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual alias: roleName -> name
JobRoleSchema.virtual('roleName').get(function () {
  return this.name;
});

module.exports = mongoose.model('JobRole', JobRoleSchema);
