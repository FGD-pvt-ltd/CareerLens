const profileService = require('../services/profileService');
const resumeService = require('../services/resumeService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Create a candidate profile
 * POST /api/profiles
 */
async function createProfile(req, res, next) {
  try {
    const profile = await profileService.createProfile(req.body);
    return successResponse(res, profile, 201, 'Candidate profile created successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve a candidate profile by ID
 * GET /api/profiles/:id
 */
async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getProfileById(req.params.id);
    if (!profile) {
      return errorResponse(res, `Candidate profile not found with ID '${req.params.id}'`, 404);
    }
    return successResponse(res, profile);
  } catch (error) {
    next(error);
  }
}

/**
 * Update candidate profile information
 * PUT /api/profiles/:id
 */
async function updateProfile(req, res, next) {
  try {
    const updated = await profileService.updateProfile(req.params.id, req.body);
    if (!updated) {
      return errorResponse(res, `Candidate profile not found with ID '${req.params.id}'`, 404);
    }
    return successResponse(res, updated, 200, 'Candidate profile updated successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a candidate profile
 * DELETE /api/profiles/:id
 */
async function deleteProfile(req, res, next) {
  try {
    const deleted = await profileService.deleteProfile(req.params.id);
    if (!deleted) {
      return errorResponse(res, `Candidate profile not found with ID '${req.params.id}'`, 404);
    }
    return successResponse(res, { id: req.params.id, deleted: true }, 200, 'Candidate profile deleted successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * Upload candidate resume PDF, extract text, and attach to profile
 * POST /api/profiles/:id/resume
 */
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return errorResponse(res, "No resume file uploaded. Please upload a PDF file using field 'resume'.", 400);
    }

    const profileId = req.params.id;
    const existing = await profileService.getProfileById(profileId);
    if (!existing) {
      return errorResponse(res, `Candidate profile not found with ID '${profileId}'`, 404);
    }

    // 1. Extract text from uploaded PDF
    const extractedText = await resumeService.extractTextFromPdf(req.file.path);

    // 2. Extract potential skills and links from text
    const keywordInsights = resumeService.extractResumeKeywords(extractedText);

    // 3. Format safe metadata (omitting private filesystem paths)
    const safeMetadata = resumeService.formatSafeFileMetadata(req.file);

    // 4. Update profile with resume metadata, extracted text, and discovered skills
    const updatedProfile = await profileService.updateProfile(profileId, {
      resume: safeMetadata,
      resumeText: extractedText,
      claimedSkills: Array.from(
        new Set([...(existing.claimedSkills || []), ...keywordInsights.extractedSkills])
      ),
    });

    return successResponse(
      res,
      {
        profileId,
        resume: safeMetadata,
        extractedTextLength: extractedText.length,
        detectedSkillsCount: keywordInsights.extractedSkills.length,
        detectedSkills: keywordInsights.extractedSkills,
        detectedLinks: keywordInsights.detectedLinks,
        profile: updatedProfile,
      },
      200,
      'Resume uploaded and text extracted successfully'
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  uploadResume,
};
