/**
 * Evidence Score Calculator
 * Measures verification strength of claimed skills against real artifacts (code commits, projects)
 */

function calculateEvidenceScore(verifiedEvidences = []) {
  if (!verifiedEvidences.length) return 0;
  
  // Baseline placeholder computation
  const totalConfidence = verifiedEvidences.reduce((sum, item) => sum + (item.confidence || 0), 0);
  const averageConfidence = (totalConfidence / verifiedEvidences.length) * 100;
  return Math.min(100, Math.max(0, Math.round(averageConfidence)));
}

module.exports = {
  calculateEvidenceScore,
};
