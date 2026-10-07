/**
 * Readiness Score Calculator
 * Aggregates skill score, evidence score, and profile completeness
 */

function calculateReadinessScore({ skillScore = 0, evidenceScore = 0, weightSkill = 0.6, weightEvidence = 0.4 }) {
  // Formula: weighted average of verified skill alignment and project evidence depth
  const readiness = (skillScore * weightSkill) + (evidenceScore * weightEvidence);
  return Math.min(100, Math.max(0, Math.round(readiness)));
}

module.exports = {
  calculateReadinessScore,
};
