const githubService = require('../services/githubService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Analyze GitHub profile and repositories via official REST API
 * POST /api/github/analyze
 */
async function analyzeGithub(req, res, next) {
  try {
    const input = req.body.username || req.body.url || req.body.profileUrl;

    if (!input || typeof input !== 'string' || !input.trim()) {
      return errorResponse(res, "Please provide a valid GitHub 'username' or profile 'url'.", 400);
    }

    const githubData = await githubService.fetchAndAnalyzeGithubProfile(input);

    return successResponse(
      res,
      githubData,
      200,
      'GitHub profile and repository evidence analyzed successfully'
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeGithub,
};
