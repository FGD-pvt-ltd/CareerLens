const mongoose = require('mongoose');
const CandidateProfile = require('../models/CandidateProfile');
const { isConnected, inMemoryStore } = require('../config/db');

/**
 * Create a new candidate profile
 */
async function createProfile(data) {
  if (isConnected()) {
    const profile = await CandidateProfile.create(data);
    return profile.toObject();
  }

  // Resilient In-Memory Fallback
  const id = new mongoose.Types.ObjectId().toString();
  const now = new Date();
  const profile = {
    _id: id,
    id,
    name: data.name,
    email: data.email.toLowerCase().trim(),
    resume: data.resume || null,
    resumeText: data.resumeText || '',
    githubUrl: data.githubUrl || '',
    codingProfiles: data.codingProfiles || [],
    portfolioUrl: data.portfolioUrl || '',
    professionalProfileUrl: data.professionalProfileUrl || '',
    targetRole: data.targetRole || null,
    targetRoleName: data.targetRoleName || '',
    education: data.education || [],
    experience: data.experience || [],
    projects: data.projects || [],
    extractedSkills: [],
    claimedSkills: data.claimedSkills || [],
    analysis: null,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryStore.candidateProfiles.set(id, profile);
  return profile;
}

/**
 * Retrieve candidate profile by ID
 */
async function getProfileById(id) {
  if (isConnected()) {
    const profile = await CandidateProfile.findById(id)
      .populate('targetRole')
      .populate('extractedSkills')
      .populate('analysis');
    return profile ? profile.toObject() : null;
  }

  // Resilient In-Memory Fallback
  return inMemoryStore.candidateProfiles.get(id) || null;
}

/**
 * Update candidate profile by ID
 */
async function updateProfile(id, updateData) {
  if (isConnected()) {
    const updated = await CandidateProfile.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    return updated ? updated.toObject() : null;
  }

  // Resilient In-Memory Fallback
  const existing = inMemoryStore.candidateProfiles.get(id);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...updateData,
    updatedAt: new Date(),
  };
  inMemoryStore.candidateProfiles.set(id, merged);
  return merged;
}

/**
 * Delete candidate profile by ID
 */
async function deleteProfile(id) {
  if (isConnected()) {
    const deleted = await CandidateProfile.findByIdAndDelete(id);
    return !!deleted;
  }

  // Resilient In-Memory Fallback
  return inMemoryStore.candidateProfiles.delete(id);
}

/**
 * Attach uploaded resume information and extracted text to profile
 */
async function attachResume(id, resumeMetadata, extractedText) {
  const updateData = {
    resume: resumeMetadata,
    resumeText: extractedText,
  };

  return updateProfile(id, updateData);
}

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  attachResume,
};
