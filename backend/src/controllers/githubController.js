const CandidateProfile = require('../models/CandidateProfile');
const githubService = require('../services/githubService');
const { isValidMongoId, validateGithubProfileInput } = require('../utils/validators');

/**
 * Ingest, normalize, and attach GitHub profile and repository evidence to a CandidateProfile
 * POST /api/profiles/:id/github
 */
async function analyzeGithubProfile(req, res, next) {
  try {
    const { id } = req.params;

    // 1. Validate candidate ID
    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    // 2. Check candidate exists in database
    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    // 3. Validate GitHub input from body
    const rawInput =
      req.body?.githubUrl || req.body?.url || req.body?.profileUrl || req.body?.username;

    const validation = validateGithubProfileInput(rawInput);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // 4. Fetch and normalize GitHub profile and repository data
    let githubData;
    try {
      githubData = await githubService.fetchAndAnalyzeGithubProfile(validation.username);
    } catch (apiError) {
      const status = apiError.statusCode || 500;
      return res.status(status).json({
        success: false,
        error: apiError.message || 'GitHub API request failed',
      });
    }

    // 5. Save normalized GitHub data cleanly into CandidateProfile (no duplicates)
    candidate.github = githubData;
    await candidate.save();

    // 6. Return standard ProfiQ response
    return res.status(200).json({
      success: true,
      message: 'GitHub profile analyzed successfully',
      data: {
        github: candidate.github,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeGithubProfile,
};
