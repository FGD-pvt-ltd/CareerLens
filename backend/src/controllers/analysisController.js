const analysisService = require('../services/analysisService');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Initiate profile analysis and evidence normalization
 * POST /api/analysis
 */
async function startAnalysis(req, res, next) {
  try {
    const { candidateId, targetRole } = req.body;

    const analysis = await analysisService.startCandidateAnalysis({
      candidateId,
      targetRole,
    });

    return successResponse(
      res,
      {
        analysisId: analysis._id || analysis.id,
        candidateId: analysis.candidate,
        targetRole: analysis.targetRoleName,
        status: analysis.analysisStatus,
        evidenceCount: (analysis.evidenceReferences || []).length,
        missingSkillsIdentified: (analysis.skillGaps || []).length,
        readinessScore: analysis.readinessScore, // Explicitly null while pending
        message: 'Evidence normalized and analysis record created with status pending.',
      },
      201,
      'Candidate profile analysis initialized successfully'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve analysis result by ID
 * GET /api/analysis/:id
 */
async function getAnalysis(req, res, next) {
  try {
    const analysis = await analysisService.getAnalysisById(req.params.id);
    if (!analysis) {
      return errorResponse(res, `Analysis record not found with ID '${req.params.id}'`, 404);
    }

    return successResponse(res, analysis);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  startAnalysis,
  getAnalysis,
};
