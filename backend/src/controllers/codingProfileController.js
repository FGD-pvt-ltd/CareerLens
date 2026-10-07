const CandidateProfile = require('../models/CandidateProfile');
const { isValidMongoId } = require('../utils/validators');
const { validateCodingProfileInput, SUPPORTED_PLATFORMS } = require('../utils/codingPlatformValidators');
const { fetchAndNormalizeCodingProfile } = require('../services/codingProfiles/codingProfileService');

/**
 * Add or update candidate coding profile evidence
 * POST /api/profiles/:id/coding-profiles
 */
async function addCodingProfile(req, res, next) {
  try {
    const { id } = req.params;

    // 1. Validate Candidate ID
    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    // 2. Verify Candidate Exists
    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    // 3. Validate Request Body
    const { platform, profileUrl } = req.body || {};
    const validation = validateCodingProfileInput(platform, profileUrl);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // 4. Fetch and Normalize Data from Platform Service
    let normalizedData;
    try {
      normalizedData = await fetchAndNormalizeCodingProfile(
        validation.platform,
        validation.username,
        validation.profileUrl
      );
    } catch (serviceErr) {
      const status = serviceErr.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: serviceErr.message || 'Failed to fetch coding profile data',
      });
    }

    // 5. Update or Add Coding Profile without Duplicates
    if (!candidate.codingProfiles) {
      candidate.codingProfiles = [];
    }

    const existingIndex = candidate.codingProfiles.findIndex(
      (p) => p.platform.toLowerCase() === validation.platform.toLowerCase()
    );

    if (existingIndex !== -1) {
      candidate.codingProfiles[existingIndex] = normalizedData;
    } else {
      candidate.codingProfiles.push(normalizedData);
    }

    await candidate.save();

    return res.status(200).json({
      success: true,
      message: `Coding profile for ${validation.platform} processed successfully`,
      data: {
        codingProfile: normalizedData,
        codingProfiles: candidate.codingProfiles,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve all coding profiles for candidate
 * GET /api/profiles/:id/coding-profiles
 */
async function getCodingProfiles(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        codingProfiles: candidate.codingProfiles || [],
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh an existing coding profile
 * PUT /api/profiles/:id/coding-profiles/:platform
 */
async function refreshCodingProfile(req, res, next) {
  try {
    const { id, platform } = req.params;

    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    const normPlatform = (platform || '').trim().toLowerCase();
    if (!SUPPORTED_PLATFORMS.includes(normPlatform)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported platform '${platform}'. Allowed: ${SUPPORTED_PLATFORMS.join(', ')}`,
      });
    }

    const existingIndex = (candidate.codingProfiles || []).findIndex(
      (p) => p.platform.toLowerCase() === normPlatform
    );

    if (existingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Coding profile for platform '${normPlatform}' not found on candidate.`,
      });
    }

    const existing = candidate.codingProfiles[existingIndex];

    // Re-fetch using existing profileUrl and username
    let updatedData;
    try {
      updatedData = await fetchAndNormalizeCodingProfile(
        normPlatform,
        existing.username,
        existing.profileUrl
      );
    } catch (serviceErr) {
      const status = serviceErr.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: serviceErr.message || 'Failed to refresh coding profile',
      });
    }

    candidate.codingProfiles[existingIndex] = updatedData;
    await candidate.save();

    return res.status(200).json({
      success: true,
      message: `Coding profile for ${normPlatform} refreshed successfully`,
      data: {
        codingProfile: updatedData,
        codingProfiles: candidate.codingProfiles,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a coding profile from candidate
 * DELETE /api/profiles/:id/coding-profiles/:platform
 */
async function deleteCodingProfile(req, res, next) {
  try {
    const { id, platform } = req.params;

    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    const normPlatform = (platform || '').trim().toLowerCase();
    const initialLen = (candidate.codingProfiles || []).length;
    candidate.codingProfiles = (candidate.codingProfiles || []).filter(
      (p) => p.platform.toLowerCase() !== normPlatform
    );

    if (candidate.codingProfiles.length === initialLen) {
      return res.status(404).json({
        success: false,
        error: `Coding profile for platform '${normPlatform}' not found on candidate.`,
      });
    }

    await candidate.save();

    return res.status(200).json({
      success: true,
      message: `Coding profile for ${normPlatform} removed successfully`,
      data: {
        codingProfiles: candidate.codingProfiles,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addCodingProfile,
  getCodingProfiles,
  refreshCodingProfile,
  deleteCodingProfile,
};
