const fs = require('fs');
const mongoose = require('mongoose');
const profileService = require('../services/profileService');
const profileAggregationService = require('../services/profileAggregationService');
const roleService = require('../services/roleService');

// Helper to validate MongoDB ObjectId
function isValidObjectId(id) {
  return id && mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Create a candidate profile
 * POST /api/profiles
 */
async function createProfile(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body cannot be empty',
      });
    }

    if (!req.body.basicInfo || typeof req.body.basicInfo !== 'object' || !req.body.basicInfo.name || !req.body.basicInfo.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Candidate name is required in basicInfo.name',
      });
    }

    // Whitelist allowed top-level fields to prevent arbitrary property injection
    const allowedFields = [
      'basicInfo', 'college', 'education', 'experience', 'skills',
      'projects', 'certifications', 'academicAchievements', 'achievements',
      'codingProfiles', 'professionalProfiles', 'portfolios', 'github',
      'resume', 'documents', 'targetRole', 'analysis'
    ];

    const cleanPayload = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        cleanPayload[field] = req.body[field];
      }
    }

    // Validate target role if provided
    if (cleanPayload.targetRole) {
      const roleMatch = await roleService.validateTargetRole(cleanPayload.targetRole);
      if (!roleMatch) {
        return res.status(404).json({
          success: false,
          error: 'Target role not found',
        });
      }
      cleanPayload.targetRole = {
        roleId: roleMatch.roleId,
        roleName: cleanPayload.targetRole.roleName || roleMatch.roleName,
        slug: roleMatch.slug,
      };
    }

    const savedProfile = await profileService.createProfile(cleanPayload);

    return res.status(201).json({
      success: true,
      message: 'Candidate profile created successfully',
      data: {
        profile: savedProfile,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors || {})[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Retrieve candidate profile by MongoDB ObjectId
 * GET /api/profiles/:id
 */
async function getProfileById(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const profile = await profileService.getProfileById(id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Candidate profile retrieved successfully',
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete candidate profile by MongoDB ObjectId
 * DELETE /api/profiles/:id
 */
async function deleteProfile(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const deleted = await profileService.deleteProfile(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Candidate profile deleted successfully',
      data: {
        profileId: id,
      },
    });
  } catch (error) {
    next(error);
  }
}


/**
 * Retrieve unified candidate profile
 * GET /api/profiles/:id/unified
 */
async function getUnifiedProfile(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const unified = await profileAggregationService.getUnifiedCandidateProfile(id);

    if (!unified) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Unified candidate profile retrieved successfully',
      data: {
        candidate: unified.candidate,
        profileCompleteness: unified.profileCompleteness,
        completenessBreakdown: unified.completenessBreakdown,
        candidateId: unified.candidateId,
        targetRole: unified.targetRole,
        aiHandoff: unified.aiHandoff,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update candidate profile with structured whitelist
 * PUT /api/profiles/:id
 */
async function updateProfile(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Update payload must be a non-empty object',
      });
    }

    const updatedProfile = await profileAggregationService.updateCandidateProfile(id, req.body);

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Candidate profile updated successfully',
      data: {
        profile: updatedProfile,
        profileCompleteness: updatedProfile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Add a project to candidate profile
 * POST /api/profiles/:id/projects
 */
async function addProject(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (!req.body || !req.body.name || !req.body.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required',
      });
    }

    const profile = await profileAggregationService.addCandidateProject(id, req.body);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Project added successfully',
      data: {
        projects: profile.projects,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Add an experience entry
 * POST /api/profiles/:id/experience
 */
async function addExperience(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (!req.body || !req.body.organization || !req.body.role) {
      return res.status(400).json({
        success: false,
        error: 'Organization and role are required for experience',
      });
    }

    const profile = await profileAggregationService.addCandidateExperience(id, req.body);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Experience entry added successfully',
      data: {
        experience: profile.experience,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Add a certification (supports JSON or multipart file upload)
 * POST /api/profiles/:id/certifications
 */
async function addCertification(req, res, next) {
  const cleanupFile = () => {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // ignore
      }
    }
  };

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const name = req.body?.name;
    if (!name || !name.trim()) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        error: 'Certification name is required',
      });
    }

    const certPayload = {
      name: name.trim(),
      issuingOrganization: req.body.issuingOrganization || req.body.issuer || null,
      issuer: req.body.issuingOrganization || req.body.issuer || null,
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : null,
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      credentialId: req.body.credentialId ? req.body.credentialId.trim() : null,
      credentialUrl: req.body.credentialUrl ? req.body.credentialUrl.trim() : null,
      certificateFileReference: req.file ? `/uploads/certificates/${req.file.filename}` : (req.body.certificateFileReference || null),
      source: req.file ? 'certificate_upload' : (req.body.credentialUrl ? 'credential_url' : 'user_input'),
    };

    const profile = await profileAggregationService.addCandidateCertification(id, certPayload);

    if (!profile) {
      cleanupFile();
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Certification added successfully',
      data: {
        certifications: profile.certifications,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    cleanupFile();
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Add or update professional profile (LinkedIn, GitLab, etc.)
 * POST /api/profiles/:id/professional-profiles
 */
async function addProfessionalProfile(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const { platform, profileUrl, url } = req.body || {};
    const targetUrl = profileUrl || url;

    if (!platform || !platform.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Platform is required for professional profile',
      });
    }

    if (!targetUrl || !targetUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: 'profileUrl is required for professional profile',
      });
    }

    const profile = await profileAggregationService.addCandidateProfessionalProfile(id, {
      ...req.body,
      platform: platform.trim(),
      profileUrl: targetUrl.trim(),
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Professional profile saved successfully',
      data: {
        professionalProfiles: profile.professionalProfiles,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Add or update portfolio entry
 * POST /api/profiles/:id/portfolios
 */
async function addPortfolio(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (!req.body || !req.body.url || !req.body.url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Portfolio URL is required',
      });
    }

    const profile = await profileAggregationService.addCandidatePortfolio(id, req.body);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Portfolio entry saved successfully',
      data: {
        portfolios: profile.portfolios,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Add extracurricular/other achievement
 * POST /api/profiles/:id/achievements
 */
async function addAchievement(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (!req.body || !req.body.title || !req.body.title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Achievement title is required',
      });
    }

    const profile = await profileAggregationService.addCandidateAchievement(id, req.body);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Achievement added successfully',
      data: {
        achievements: profile.achievements,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Add academic achievement
 * POST /api/profiles/:id/academic-achievements
 */
async function addAcademicAchievement(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (!req.body || !req.body.title || !req.body.title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Academic achievement title is required',
      });
    }

    const profile = await profileAggregationService.addCandidateAcademicAchievement(id, req.body);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Academic achievement added successfully',
      data: {
        academicAchievements: profile.academicAchievements,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({
        success: false,
        error: firstError,
      });
    }
    next(error);
  }
}

/**
 * Set target role for candidate
 * PUT /api/profiles/:id/target-role
 */
async function setTargetRole(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const profile = await profileAggregationService.setCandidateTargetRole(id, req.body);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Target role updated successfully',
      data: {
        targetRole: profile.targetRole,
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
}

/**
 * Trigger analysis on a candidate profile and return updated metrics & acceptance verdict
 * POST /api/profiles/:id/analyze
 */
async function analyzeCandidateProfile(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const analysis = await profileService.analyzeProfile(id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Candidate profile evaluated successfully',
      data: {
        analysis,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProfile,
  getProfileById,
  deleteProfile,
  getUnifiedProfile,
  updateProfile,
  addProject,
  addExperience,
  addCertification,
  addProfessionalProfile,
  addPortfolio,
  addAchievement,
  addAcademicAchievement,
  setTargetRole,
  analyzeCandidateProfile,
};
