const roadmapService = require('../services/roadmapService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Retrieve career readiness roadmap for an analysis
 * GET /api/roadmap/:analysisId
 */
async function getRoadmap(req, res, next) {
  try {
    const { analysisId } = req.params;
    const roadmap = await roadmapService.getRoadmapByAnalysisId(analysisId);

    if (!roadmap) {
      return errorResponse(res, `Roadmap not found for analysis ID '${analysisId}'`, 404);
    }

    return successResponse(res, roadmap);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRoadmap,
};
