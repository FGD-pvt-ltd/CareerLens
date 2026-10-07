const env = require('../config/env');
const { validateAndNormalizeAiResponse } = require('../utils/aiResponseNormalizer');

/**
 * AI Client Service
 * 
 * Manages HTTP communication between Node.js and Aman's Python/FastAPI AI Service.
 * Transports payloads, handles timeouts, validates responses, and normalizes output.
 * Does NOT contain AI/LLM interpretation logic.
 */

/**
 * Check connectivity and health of the Python/FastAPI AI service
 * GET ${AI_SERVICE_URL}/health
 */
async function checkAiHealth() {
  const serviceUrl = process.env.AI_SERVICE_URL || env.AI_SERVICE_URL || 'http://localhost:8000';
  const healthUrl = `${serviceUrl.replace(/\/+$/, '')}/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { available: true };
    }

    return {
      available: false,
      error: `AI service returned HTTP ${res.status}`,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    return {
      available: false,
      error: isTimeout ? 'AI service health check timed out' : 'AI service unreachable',
    };
  }
}

/**
 * Send normalized candidate evidence to FastAPI for AI evaluation.
 * POST ${AI_SERVICE_URL}/api/analyze
 * 
 * @param {object} aiPayload - Normalized unified candidate profile and target role
 * @returns {Promise<object>} Normalized AI response
 */
async function analyzeCandidateProfile(aiPayload) {
  if (!aiPayload || !aiPayload.candidateId) {
    throw new Error('Invalid AI request payload: candidateId is required.');
  }

  const candidateId = aiPayload.candidateId;
  const targetRoleName = aiPayload.targetRole?.roleName || 'Unspecified Role';

  // Development mock mode: strictly isolated for dev/test when FastAPI is not running
  if (env.MOCK_AI_SERVICE) {
    console.log(`[AI Service] (DEVELOPMENT MOCK ONLY) Simulating AI analysis for candidateId=${candidateId}`);
    return validateAndNormalizeAiResponse(
      {
        success: true,
        data: {
          candidateId: candidateId.toString(),
          readinessScore: 78,
          scoreBreakdown: {
            skillConfidence: 80,
            projectEvidence: 75,
            codingRigor: 82,
            academicRigor: 70,
          },
          skills: ['Node.js', 'Express', 'MongoDB', 'System Design'],
          strengths: ['Solid full stack fundamentals', 'Production repository structure'],
          gaps: ['Container orchestration (Kubernetes)', 'CI/CD pipeline automation'],
          roadmap: [
            { step: '1', title: 'Add Docker containerization', duration: 'Week 1', status: 'Next' },
            { step: '2', title: 'Deploy on cloud provider', duration: 'Week 2', status: 'Planned' },
          ],
        },
        metadata: {
          serviceVersion: '1.0.0-mock',
          model: 'DEVELOPMENT_MOCK_ONLY',
          analyzedAt: new Date().toISOString(),
        },
      },
      candidateId
    );
  }

  const serviceUrl = process.env.AI_SERVICE_URL || env.AI_SERVICE_URL || 'http://localhost:8000';
  const endpointUrl = `${serviceUrl.replace(/\/+$/, '')}/api/analyze`;
  const timeoutMs = env.AI_SERVICE_TIMEOUT_MS || 15000;

  console.log(`[AI Service] AI request started for candidateId=${candidateId}, targetRole="${targetRoleName}"`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(aiPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const rawText = await res.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(rawText);
    } catch {
      throw new Error(`AI service returned invalid non-JSON response (HTTP ${res.status}): ${rawText.slice(0, 150)}`);
    }

    if (!res.ok) {
      const errMsg = jsonResponse?.error || jsonResponse?.detail || jsonResponse?.message || `HTTP ${res.status}`;
      throw new Error(`AI service responded with error: ${errMsg}`);
    }

    // Validate and normalize raw response
    const normalized = validateAndNormalizeAiResponse(jsonResponse, candidateId);

    console.log(`[AI Service] AI request completed for candidateId=${candidateId}`);
    return normalized;
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    const safeErrorMessage = isTimeout
      ? `AI service request timed out after ${timeoutMs}ms`
      : err.message || 'AI service connection failed';

    console.error(`[AI Service] AI request failed for candidateId=${candidateId}: ${safeErrorMessage}`);

    const error = new Error(safeErrorMessage);
    error.isTimeout = isTimeout;
    error.statusCode = isTimeout ? 504 : 502;
    throw error;
  }
}

/**
 * Clean function that prepares the AI payload conforming strictly to the AI service contract:
 * {
 *   candidateId: "...",
 *   targetRole: { roleId: "...", roleName: "..." },
 *   profile: {
 *     basicInfo: {},
 *     college: {},
 *     education: [],
 *     experience: [],
 *     skills: [],
 *     projects: [],
 *     certifications: [],
 *     academicAchievements: [],
 *     achievements: [],
 *     resume: {},
 *     github: {},
 *     codingProfiles: [],
 *     professionalProfiles: [],
 *     portfolios: []
 *   }
 * }
 * 
 * Strict boundary:
 * - NO MongoDB credentials
 * - NO GitHub tokens
 * - NO Gemini / OpenAI keys
 * - NO filesystem storage paths
 * - NO internal MongoDB fields (__v, _id on subdocuments)
 */
function prepareAiPayload(candidateId, targetRole, unifiedCandidate) {
  if (!candidateId) {
    throw new Error('candidateId is required to prepare AI payload');
  }

  const roleObj = {
    roleId: targetRole?.roleId ? String(targetRole.roleId) : '',
    roleName: targetRole?.roleName ? String(targetRole.roleName) : '',
  };

  const cand = (unifiedCandidate && unifiedCandidate.candidate) ? unifiedCandidate.candidate : (unifiedCandidate || {});

  const cleanProfile = {
    basicInfo: {
      name: cand.basicInfo?.name || '',
      email: cand.basicInfo?.email || '',
      phone: cand.basicInfo?.phone || null,
      location: cand.basicInfo?.location || null,
      headline: cand.basicInfo?.headline || null,
      profilePhotoUrl: cand.basicInfo?.profilePhotoUrl || null,
    },
    college: {
      collegeName: cand.college?.collegeName || null,
      university: cand.college?.university || null,
      degree: cand.college?.degree || null,
      branch: cand.college?.branch || null,
      specialization: cand.college?.specialization || null,
      yearOfStudy: cand.college?.yearOfStudy || null,
      graduationYear: cand.college?.graduationYear ?? null,
      cgpa: cand.college?.cgpa ?? null,
      percentage: cand.college?.percentage ?? null,
      relevantCoursework: Array.isArray(cand.college?.relevantCoursework) ? cand.college.relevantCoursework : [],
      academicAchievements: Array.isArray(cand.college?.academicAchievements) ? cand.college.academicAchievements : [],
    },
    education: (Array.isArray(cand.education) ? cand.education : []).map((e) => ({
      level: e.level || null,
      institution: e.institution || null,
      degree: e.degree || null,
      field: e.field || null,
      startYear: e.startYear ?? null,
      endYear: e.endYear ?? null,
      cgpa: e.cgpa ?? null,
      percentage: e.percentage ?? null,
    })),
    experience: (Array.isArray(cand.experience) ? cand.experience : []).map((exp) => ({
      organization: exp.organization || '',
      role: exp.role || '',
      employmentType: exp.employmentType || null,
      location: exp.location || null,
      startDate: exp.startDate || null,
      endDate: exp.endDate || null,
      isCurrent: Boolean(exp.isCurrent),
      description: exp.description || '',
      technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      source: exp.source || 'user_input',
    })),
    skills: (Array.isArray(cand.skills) ? cand.skills : []).map((s) => ({
      name: typeof s === 'string' ? s : (s.name || ''),
      category: s.category || null,
      source: s.source || 'user_input',
    })),
    projects: (Array.isArray(cand.projects) ? cand.projects : []).map((p) => ({
      name: p.name || '',
      description: p.description || '',
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      category: p.category || null,
      role: p.role || null,
      startDate: p.startDate || null,
      endDate: p.endDate || null,
      githubUrl: p.githubUrl || null,
      liveUrl: p.liveUrl || null,
      demoUrl: p.demoUrl || null,
      teamSize: p.teamSize ?? 1,
      source: p.source || 'user_input',
    })),
    certifications: (Array.isArray(cand.certifications) ? cand.certifications : []).map((c) => ({
      name: c.name || '',
      issuingOrganization: c.issuingOrganization || c.issuer || null,
      issueDate: c.issueDate || null,
      expiryDate: c.expiryDate || null,
      credentialId: c.credentialId || null,
      credentialUrl: c.credentialUrl || null,
      source: c.source || 'user_input',
    })),
    academicAchievements: (Array.isArray(cand.academicAchievements) ? cand.academicAchievements : []).map((a) => ({
      title: a.title || '',
      description: a.description || '',
      date: a.date || null,
      organization: a.organization || null,
      credentialUrl: a.credentialUrl || null,
      source: a.source || 'user_input',
    })),
    achievements: (Array.isArray(cand.achievements) ? cand.achievements : []).map((a) => ({
      title: a.title || '',
      description: a.description || '',
      category: a.category || 'other',
      date: a.date || null,
      organization: a.organization || null,
      source: a.source || 'user_input',
    })),
    resume: {
      hasResume: Boolean(cand.resume?.hasResume),
      hasCv: Boolean(cand.resume?.hasCv),
      resumeText: cand.resume?.resumeText || '',
      cvText: cand.resume?.cvText || '',
      uploadedAt: cand.resume?.uploadedAt || null,
    },
    github: {
      username: cand.github?.username || null,
      profileUrl: cand.github?.profileUrl || null,
      name: cand.github?.name || null,
      bio: cand.github?.bio || null,
      avatarUrl: cand.github?.avatarUrl || null,
      company: cand.github?.company || null,
      location: cand.github?.location || null,
      publicRepositoryCount: cand.github?.publicRepositoryCount || 0,
      followers: cand.github?.followers || 0,
      following: cand.github?.following || 0,
      repositories: (cand.github?.repositories || []).map((r) => ({
        name: r.name,
        fullName: r.fullName,
        description: r.description,
        url: r.url,
        homepage: r.homepage,
        primaryLanguage: r.primaryLanguage,
        languages: r.languages || [],
        topics: r.topics || [],
        stars: r.stars || 0,
        forks: r.forks || 0,
        updatedAt: r.updatedAt,
        archived: r.archived,
        fork: r.fork,
        readme: r.readme || '',
      })),
      languageSummary: cand.github?.languageSummary || {},
      activity: cand.github?.activity || {},
      analyzedAt: cand.github?.analyzedAt || null,
    },
    codingProfiles: (Array.isArray(cand.codingProfiles) ? cand.codingProfiles : []).map((cp) => ({
      platform: cp.platform,
      username: cp.username,
      profileUrl: cp.profileUrl,
      stats: {
        problemsSolved: cp.stats?.problemsSolved ?? null,
        rating: cp.stats?.rating ?? null,
        rank: cp.stats?.rank ?? null,
        contestsParticipated: cp.stats?.contestsParticipated ?? null,
      },
      problemBreakdown: {
        easy: cp.problemBreakdown?.easy ?? null,
        medium: cp.problemBreakdown?.medium ?? null,
        hard: cp.problemBreakdown?.hard ?? null,
      },
      languages: cp.languages || [],
      activity: {
        lastActiveDate: cp.activity?.lastActiveDate || null,
      },
      dataSource: cp.dataSource,
      fetchStatus: cp.fetchStatus,
      fetchedAt: cp.fetchedAt,
    })),
    professionalProfiles: (Array.isArray(cand.professionalProfiles) ? cand.professionalProfiles : []).map((pp) => ({
      platform: pp.platform,
      profileUrl: pp.profileUrl || null,
      username: pp.username || null,
      displayName: pp.displayName || null,
      fetchStatus: pp.fetchStatus || 'user_provided',
      dataSource: pp.dataSource || 'user_provided',
    })),
    portfolios: (Array.isArray(cand.portfolios) ? cand.portfolios : []).map((pf) => ({
      platform: pf.platform || 'Other',
      url: pf.url,
      title: pf.title || null,
      description: pf.description || null,
      type: pf.type || null,
      fetchStatus: pf.fetchStatus || 'user_provided',
      dataSource: pf.dataSource || 'user_provided',
    })),
  };

  return {
    candidateId: String(candidateId),
    targetRole: roleObj,
    profile: cleanProfile,
  };
}

module.exports = {
  checkAiHealth,
  analyzeCandidateProfile,
  prepareAiPayload,
};

