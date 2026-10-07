const CandidateProfile = require('../models/CandidateProfile');
const Analysis = require('../models/Analysis');
const { evaluateProfile } = require('./analysisService');

/**
 * Create a new candidate profile document in MongoDB with initial evaluation
 */
async function createProfile(data) {
  const evaluation = evaluateProfile(data);
  const profile = new CandidateProfile({
    ...data,
    analysis: evaluation,
  });
  return await profile.save();
}

/**
 * Retrieve candidate profile by MongoDB ObjectId
 */
async function getProfileById(id) {
  return await CandidateProfile.findById(id);
}

/**
 * Delete candidate profile by MongoDB ObjectId and cascade cleanup
 */
async function deleteProfile(id) {
  const profile = await CandidateProfile.findByIdAndDelete(id);
  if (profile) {
    // Clean up associated analyses
    await Analysis.deleteMany({ candidateId: id });
  }
  return profile;
}

/**
 * Re-evaluate candidate profile based on updated inputs/documents and persist in MongoDB
 */
async function analyzeProfile(id) {
  const profile = await CandidateProfile.findById(id);
  if (!profile) return null;

  const evaluation = evaluateProfile(profile);
  profile.analysis = evaluation;
  await profile.save();
  return evaluation;
}

module.exports = {
  createProfile,
  getProfileById,
  deleteProfile,
  analyzeProfile,
};

