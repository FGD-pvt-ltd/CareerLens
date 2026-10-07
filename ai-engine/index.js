/**
 * SkillProof AI Engine Entrypoint
 * Exports agents, scoring algorithms, and schemas
 */

const profileAnalyzer = require('./agents/profileAnalyzer');
const skillExtractor = require('./agents/skillExtractor');
const evidenceVerifier = require('./agents/evidenceVerifier');
const roleMatcher = require('./agents/roleMatcher');
const roadmapGenerator = require('./agents/roadmapGenerator');

const readinessScore = require('./scoring/readinessScore');
const skillScore = require('./scoring/skillScore');
const evidenceScore = require('./scoring/evidenceScore');

const profileSchema = require('./schemas/profileSchema.json');
const skillsSchema = require('./schemas/skillsSchema.json');
const analysisSchema = require('./schemas/analysisSchema.json');

module.exports = {
  agents: {
    profileAnalyzer,
    skillExtractor,
    evidenceVerifier,
    roleMatcher,
    roadmapGenerator,
  },
  scoring: {
    readinessScore,
    skillScore,
    evidenceScore,
  },
  schemas: {
    profileSchema,
    skillsSchema,
    analysisSchema,
  },
};
