const { inMemoryStore } = require('../config/db');

/**
 * Generate modular baseline roadmap structure based on target role and identified gaps
 */
function generateBaselineRoadmap(roleName = 'Target Role', skillGaps = []) {
  const missingSkillNames = skillGaps.map((g) => g.skill);

  const phase1Skills = missingSkillNames.slice(0, 2);
  const phase2Skills = missingSkillNames.slice(2, 4);
  const remainingSkills = missingSkillNames.slice(4);

  return {
    targetRole: roleName,
    summary: `Structured 4-Phase Career Readiness Roadmap for ${roleName}. Designed to bridge identified skill gaps with verified project evidence.`,
    learningPriorities: missingSkillNames.length > 0 ? missingSkillNames : ['Advanced System Architecture', 'Production Deployment & Monitoring'],
    milestones: [
      {
        phase: 1,
        title: 'Core Fundamentals & Critical Skill Gap Closure',
        durationWeeks: 'Weeks 1-2',
        focusSkills: phase1Skills.length > 0 ? phase1Skills : ['Data Structures', 'API Protocols'],
        description: 'Establish foundational proficiency in missing critical technologies required by industry role benchmarks.',
        suggestedResources: [
          'Official Documentation & Interactive Tutorials',
          'FreeCodeCamp / GitHub Open-Source Curriculum',
        ],
        progressionSteps: [
          'Complete guided exercises on core syntax and idioms',
          'Build isolated mini-modules demonstrating each skill',
        ],
      },
      {
        phase: 2,
        title: 'Evidence-Backed Project Implementation',
        durationWeeks: 'Weeks 3-4',
        focusSkills: phase2Skills.length > 0 ? phase2Skills : ['Modular Architecture', 'Database Persistence'],
        description: 'Construct a full-stack, demonstrable project that integrates target role technologies with atomic Git commits.',
        projectSuggestions: [
          `Production-Ready ${roleName} Capstone Project featuring automated tests and clear documentation`,
        ],
        progressionSteps: [
          'Design repository schema and write comprehensive README.md',
          'Implement core features with test-driven development',
          'Deploy live demonstration instance on modern cloud provider',
        ],
      },
      {
        phase: 3,
        title: 'Public Artifact Verification & Code Review',
        durationWeeks: 'Weeks 5-6',
        focusSkills: remainingSkills.length > 0 ? remainingSkills : ['CI/CD', 'Documentation', 'Code Quality'],
        description: 'Verify code quality and ensure public repository artifacts pass automated ProfiQ verification heuristics.',
        progressionSteps: [
          'Configure GitHub Actions for automated linting and test coverage',
          'Add documentation and architectural decision records (ADRs)',
          'Engage in peer code review or open-source contribution',
        ],
      },
      {
        phase: 4,
        title: 'Interview Readiness & Portfolio Presentation',
        durationWeeks: 'Weeks 7-8',
        focusSkills: ['Technical Communication', 'System Design Walkthrough'],
        description: 'Simulate technical evaluations and articulate architecture decisions for placement interviews.',
        progressionSteps: [
          'Practice explaining project trade-offs and code complexity',
          'Conduct mock technical interviews against role benchmarks',
        ],
      },
    ],
  };
}

/**
 * Retrieve roadmap by analysis ID
 */
async function getRoadmapByAnalysisId(analysisId) {
  const Analysis = require('../models/Analysis');
  const { isConnected } = require('../config/db');

  let analysis = null;

  if (isConnected()) {
    try {
      analysis = await Analysis.findById(analysisId);
    } catch {}
  }

  if (!analysis) {
    analysis = inMemoryStore.analyses.get(analysisId);
  }

  if (!analysis) return null;

  return (
    analysis.roadmap ||
    generateBaselineRoadmap(
      analysis.targetRoleName || 'Target Role',
      analysis.skillGaps || []
    )
  );
}

module.exports = {
  generateBaselineRoadmap,
  getRoadmapByAnalysisId,
};
