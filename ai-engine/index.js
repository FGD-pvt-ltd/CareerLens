/**
 * ProfiQ AI Engine Entrypoint (Foundation)
 * 
 * Modular architecture prepared for:
 * - Skill Extraction (resume parsing, profile analysis)
 * - Evidence Verification (code & GitHub artifact verification)
 * - Role Matching (target job requirements alignment)
 * - Roadmap Generation (personalized learning & gap resolution)
 * - Scoring (deterministic readiness, skill, and evidence metrics)
 * 
 * Note: AI logic and agent implementations will be introduced in Task 2.
 */

const scoring = require('./scoring/readinessScore');

module.exports = {
  version: '1.0.0',
  modules: [
    'skill-extraction',
    'evidence-verification',
    'role-matching',
    'roadmap-generation',
    'scoring',
  ],
  scoring,
};
