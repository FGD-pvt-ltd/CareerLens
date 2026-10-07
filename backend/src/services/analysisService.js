const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const Evidence = require('../models/Evidence');
const CandidateProfile = require('../models/CandidateProfile');
const { isConnected, inMemoryStore } = require('../config/db');
const { getProfileById, updateProfile } = require('./profileService');
const { findRoleByNameOrId } = require('./roleService');
const { extractResumeKeywords } = require('./resumeService');
const { fetchAndAnalyzeGithubProfile } = require('./githubService');
const { normalizePortfolioEvidence, normalizeCodingProfiles } = require('./portfolioService');
const { generateBaselineRoadmap } = require('./roadmapService');

/**
 * Initiate candidate profile analysis and evidence normalization
 */
async function startCandidateAnalysis({ candidateId, targetRole: targetRoleInput }) {
  // 1. Load candidate profile
  const profile = await getProfileById(candidateId);
  if (!profile) {
    const err = new Error(`Candidate profile not found with ID: '${candidateId}'`);
    err.statusCode = 404;
    throw err;
  }

  // 2. Resolve target job role benchmark
  const roleBenchmark = await findRoleByNameOrId(targetRoleInput);
  if (!roleBenchmark) {
    const err = new Error(`Target role '${targetRoleInput}' not recognized. Please choose a valid industry role benchmark.`);
    err.statusCode = 400;
    throw err;
  }

  // 3. Collect & Normalize Evidence from all candidate sources
  const normalizedEvidences = [];

  // A. Resume Evidence
  if (profile.resumeText) {
    const keywords = extractResumeKeywords(profile.resumeText);
    keywords.extractedSkills.forEach((skill) => {
      normalizedEvidences.push({
        sourceType: 'resume',
        sourceUrl: profile.resume?.filename ? `/uploads/${profile.resume.filename}` : '',
        skill,
        evidence: `Extracted from uploaded resume document: '${skill}' explicitly claimed.`,
        strength: 'low', // Resume claims start at low confidence until verified by code
        metadata: {
          originalName: profile.resume?.originalName || 'resume.pdf',
          source: 'resume-text-extraction',
        },
        timestamp: new Date(),
      });
    });
  }

  // B. GitHub Evidence
  if (profile.githubUrl) {
    try {
      const githubData = await fetchAndAnalyzeGithubProfile(profile.githubUrl);
      if (githubData && githubData.normalizedEvidences) {
        normalizedEvidences.push(...githubData.normalizedEvidences);
      }
    } catch (ghErr) {
      console.warn(`[AnalysisService] GitHub evidence collection notice: ${ghErr.message}`);
    }
  }

  // C. Portfolio Evidence
  if (profile.portfolioUrl) {
    const portfolioEvidences = normalizePortfolioEvidence(profile.portfolioUrl, profile.name);
    normalizedEvidences.push(...portfolioEvidences);
  }

  // D. Coding Platform Evidence
  if (profile.codingProfiles && profile.codingProfiles.length > 0) {
    const codingEvidences = normalizeCodingProfiles(profile.codingProfiles);
    normalizedEvidences.push(...codingEvidences);
  }

  // 4. Compute realistic skill gap benchmarks against target role
  const claimedSkillsLower = new Set([
    ...(profile.claimedSkills || []).map((s) => s.toLowerCase()),
    ...normalizedEvidences.map((e) => e.skill.toLowerCase()),
  ]);

  const skillGaps = [];
  const requiredList = roleBenchmark.requiredSkills || [];

  requiredList.forEach((req) => {
    const isPresent = claimedSkillsLower.has(req.skill.toLowerCase());
    if (!isPresent) {
      skillGaps.push({
        skill: req.skill,
        importance: req.importance || 'critical',
        currentStatus: 'missing',
        notes: `Required for ${roleBenchmark.roleName} benchmark, but not found in profile or submitted evidence.`,
      });
    }
  });

  // 5. Generate modular milestone roadmap based on missing skills
  const roadmapData = generateBaselineRoadmap(roleBenchmark.roleName, skillGaps);

  // 6. Persist Evidence and Analysis records
  const analysisId = new mongoose.Types.ObjectId().toString();
  const now = new Date();

  // Construct unverified skills collection (awaiting AI engine scoring)
  const unverifiedSkills = Array.from(
    new Set(normalizedEvidences.map((e) => e.skill))
  );

  const analysisRecord = {
    _id: analysisId,
    id: analysisId,
    candidate: candidateId,
    targetRole: roleBenchmark._id,
    targetRoleName: roleBenchmark.roleName,
    readinessScore: null, // Strictly null: Pending AI scoring execution
    technicalScore: null,
    projectScore: null,
    evidenceScore: null,
    roleAlignmentScore: null,
    consistencyScore: null,
    scoreBreakdown: {
      technical: null,
      project: null,
      evidence: null,
      consistency: null,
      roleAlignment: null,
    },
    verifiedStrengths: [],
    skillGaps,
    recommendations: [
      `Analysis initialized for target role '${roleBenchmark.roleName}'.`,
      'Normalized candidate evidence collection complete.',
      'Ready for verification pass with ProfiQ AI Engine.',
    ],
    roadmap: roadmapData,
    analysisStatus: 'pending',
    evidenceReferences: normalizedEvidences,
    createdAt: now,
    updatedAt: now,
  };

  if (isConnected()) {
    try {
      const created = await Analysis.create(analysisRecord);
      // Link to candidate profile
      await CandidateProfile.findByIdAndUpdate(candidateId, {
        analysis: created._id,
        targetRole: roleBenchmark._id,
        targetRoleName: roleBenchmark.roleName,
      });
      return created.toObject();
    } catch (dbErr) {
      console.warn(`[AnalysisService] Falling back to memory store: ${dbErr.message}`);
    }
  }

  // Fallback in memory
  inMemoryStore.analyses.set(analysisId, analysisRecord);
  await updateProfile(candidateId, {
    analysis: analysisId,
    targetRole: roleBenchmark._id,
    targetRoleName: roleBenchmark.roleName,
  });

  return analysisRecord;
}

/**
 * Retrieve analysis result by ID
 */
async function getAnalysisById(id) {
  let record = null;

  if (isConnected()) {
    try {
      const found = await Analysis.findById(id)
        .populate('candidate')
        .populate('targetRole');
      if (found) record = found.toObject();
    } catch (err) {
      console.warn(`[AnalysisService] Error querying MongoDB by ID: ${err.message}`);
    }
  }

  if (!record) {
    record = inMemoryStore.analyses.get(id);
  }

  if (!record) return null;

  // Format clean standardized response object
  return {
    id: record._id || record.id,
    candidateId: record.candidate?._id || record.candidate,
    targetRole: record.targetRoleName || record.targetRole?.roleName || 'Target Role',
    status: record.analysisStatus,
    readinessScore: record.readinessScore, // null while pending
    scoreBreakdown: record.scoreBreakdown || {
      technical: record.technicalScore,
      project: record.projectScore,
      evidence: record.evidenceScore,
      consistency: record.consistencyScore,
      roleAlignment: record.roleAlignmentScore,
    },
    verifiedSkills: record.verifiedStrengths || [],
    partiallyVerifiedSkills: [],
    unverifiedSkills: (record.evidenceReferences || []).map((e) => e.skill),
    strengths: record.verifiedStrengths || [],
    gaps: record.skillGaps || [],
    recommendations: record.recommendations || [],
    roadmapReference: record.roadmap ? `/api/roadmap/${record._id || record.id}` : null,
    roadmap: record.roadmap,
    evidenceReferences: record.evidenceReferences || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

module.exports = {
  startCandidateAnalysis,
  getAnalysisById,
};
