/**
 * Analysis Controller
 * Triggers profile scoring and fetches readiness insights
 */

async function triggerAnalysis(req, res, next) {
  try {
    const { profileId, targetRoleId } = req.body;
    return res.status(200).json({
      success: true,
      message: 'Analysis initiated (placeholder)',
      analysisId: 'mock-analysis-id',
      data: { profileId, targetRoleId },
    });
  } catch (error) {
    next(error);
  }
}

async function getAnalysisResult(req, res, next) {
  try {
    const { id } = req.params;
    return res.status(200).json({
      success: true,
      analysisId: id,
      readinessScore: 0,
      skillScore: 0,
      evidenceScore: 0,
      verifiedSkills: [],
      missingSkills: [],
      message: 'Analysis results placeholder',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  triggerAnalysis,
  getAnalysisResult,
};
