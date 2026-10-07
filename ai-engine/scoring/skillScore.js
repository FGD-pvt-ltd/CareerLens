/**
 * Skill Score Calculator
 * Evaluates candidate skill match against target role required skills
 */

function calculateSkillScore(candidateSkills = [], roleRequiredSkills = []) {
  if (!roleRequiredSkills.length) return 0;
  
  // Baseline placeholder computation
  const matched = candidateSkills.filter((s) => roleRequiredSkills.includes(s));
  const score = (matched.length / roleRequiredSkills.length) * 100;
  return Math.min(100, Math.max(0, Math.round(score)));
}

module.exports = {
  calculateSkillScore,
};
