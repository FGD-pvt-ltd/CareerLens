/**
 * Profile & Document Service
 * Handles communication with the ProfiQ Node.js / Express backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Check backend connection status
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Create a candidate profile in MongoDB
 * POST /api/profiles
 */
export async function createCandidateProfile(profileData) {
  const res = await fetch(`${API_BASE_URL}/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to create profile (${res.status})`);
  }

  return data;
}

/**
 * Upload a candidate Resume or CV PDF to backend pipeline
 * POST /api/profiles/:id/documents
 */
export async function uploadCandidateDocument(profileId, file, documentType = 'resume') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);

  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/documents`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to upload document (${res.status})`);
  }

  return data;
}

/**
 * Retrieve a candidate profile by MongoDB ObjectId
 * GET /api/profiles/:id
 */
export async function getCandidateProfile(profileId) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch profile (${res.status})`);
  }

  return data;
}

/**
 * Retrieve candidate's uploaded document metadata
 * GET /api/profiles/:id/documents
 */
export async function getCandidateDocuments(profileId) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/documents`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch documents (${res.status})`);
  }

  return data;
}

/**
 * Retrieve raw document text for AI engine
 * GET /api/profiles/:id/documents/text
 */
export async function getCandidateDocumentText(profileId) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/documents/text`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch document text (${res.status})`);
  }

  return data;
}

/**
 * Trigger analysis on a candidate profile and return updated metrics & acceptance verdict
 * POST /api/profiles/:id/analyze
 */
export async function analyzeCandidateProfile(profileId) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to analyze profile (${res.status})`);
  }

  return data;
}

/**
 * Trigger GitHub profile ingestion and evidence data collection
 * POST /api/profiles/:id/github
 */
export async function analyzeCandidateGithub(profileId, githubUrl) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/github`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ githubUrl }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to analyze GitHub profile (${res.status})`);
  }

  return data;
}

/**
 * Add or update candidate coding platform profile evidence
 * POST /api/profiles/:id/coding-profiles
 */
export async function addCodingProfile(profileId, platform, profileUrl) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/coding-profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ platform, profileUrl }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to add coding profile (${res.status})`);
  }

  return data;
}

/**
 * Get all coding platform profiles for candidate
 * GET /api/profiles/:id/coding-profiles
 */
export async function getCodingProfiles(profileId) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/coding-profiles`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch coding profiles (${res.status})`);
  }

  return data;
}

/**
 * Refresh an existing coding platform profile
 * PUT /api/profiles/:id/coding-profiles/:platform
 */
export async function refreshCodingProfile(profileId, platform) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/coding-profiles/${platform}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Failed to refresh coding profile (${res.status})`);
  }

  return data;
}

/**
 * Delete a coding platform profile
 * DELETE /api/profiles/:id/coding-profiles/:platform
 */
export async function deleteCodingProfile(profileId, platform) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/coding-profiles/${platform}`, {
    method: 'DELETE',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to delete coding profile (${res.status})`);
  }
  return data;
}

/**
 * Retrieve unified candidate profile
 * GET /api/profiles/:id/unified
 */
export async function getUnifiedProfile(profileId) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/unified`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch unified profile (${res.status})`);
  }
  return data;
}

/**
 * Update candidate profile with structured whitelist
 * PUT /api/profiles/:id
 */
export async function updateCandidateProfile(profileId, updateData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to update profile (${res.status})`);
  }
  return data;
}

/**
 * Add a candidate project
 * POST /api/profiles/:id/projects
 */
export async function addCandidateProject(profileId, projectData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to add project (${res.status})`);
  }
  return data;
}

/**
 * Add an experience entry
 * POST /api/profiles/:id/experience
 */
export async function addCandidateExperience(profileId, experienceData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/experience`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(experienceData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to add experience (${res.status})`);
  }
  return data;
}

/**
 * Add a certification with optional certificate file
 * POST /api/profiles/:id/certifications
 */
export async function addCandidateCertification(profileId, certData, file = null) {
  let res;
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(certData).forEach((key) => {
      if (certData[key] !== undefined && certData[key] !== null) {
        formData.append(key, certData[key]);
      }
    });
    res = await fetch(`${API_BASE_URL}/profiles/${profileId}/certifications`, {
      method: 'POST',
      body: formData,
    });
  } else {
    res = await fetch(`${API_BASE_URL}/profiles/${profileId}/certifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(certData),
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to add certification (${res.status})`);
  }
  return data;
}

/**
 * Add or update professional profile (LinkedIn, GitLab, etc.)
 * POST /api/profiles/:id/professional-profiles
 */
export async function addCandidateProfessionalProfile(profileId, profData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/professional-profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to add professional profile (${res.status})`);
  }
  return data;
}

/**
 * Add or update portfolio
 * POST /api/profiles/:id/portfolios
 */
export async function addCandidatePortfolio(profileId, portfolioData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(portfolioData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to add portfolio (${res.status})`);
  }
  return data;
}

/**
 * Add achievement
 * POST /api/profiles/:id/achievements
 */
export async function addCandidateAchievement(profileId, achievementData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/achievements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(achievementData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to add achievement (${res.status})`);
  }
  return data;
}

/**
 * Add academic achievement
 * POST /api/profiles/:id/academic-achievements
 */
export async function addCandidateAcademicAchievement(profileId, academicData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/academic-achievements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(academicData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to add academic achievement (${res.status})`);
  }
  return data;
}

/**
 * Set target role
 * PUT /api/profiles/:id/target-role
 */
export async function setCandidateTargetRole(profileId, targetRoleData) {
  const res = await fetch(`${API_BASE_URL}/profiles/${profileId}/target-role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(targetRoleData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to update target role (${res.status})`);
  }
  return data;
}

/**
 * Initiate AI Candidate Analysis
 * POST /api/analysis
 */
export async function startCandidateAnalysis(candidateId, targetRole = null) {
  const payload = { candidateId };
  if (targetRole) {
    payload.targetRole = targetRole;
  }

  const res = await fetch(`${API_BASE_URL}/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 202) {
    throw new Error(data.error || `Failed to initiate analysis (${res.status})`);
  }
  return data;
}

/**
 * Retrieve Analysis status and results by ID
 * GET /api/analysis/:id
 */
export async function getAnalysisResult(analysisId) {
  const res = await fetch(`${API_BASE_URL}/analysis/${analysisId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch analysis (${res.status})`);
  }
  return data;
}

/**
 * Check Python/FastAPI AI Service Health
 * GET /api/ai/health
 */
export async function checkAiServiceHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/health`);
    const data = await res.json().catch(() => ({}));
    return {
      available: res.ok && data.success === true,
      data: data.data || null,
      error: data.error || null,
    };
  } catch (err) {
    return {
      available: false,
      error: err.message || 'AI service health check failed',
    };
  }
}

/**
 * Fetch all available benchmark job roles
 * GET /api/roles
 */
export async function getAvailableJobRoles(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}/roles${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch job roles (${res.status})`);
  }
  return data;
}

/**
 * Fetch specific job role by MongoDB ObjectId
 * GET /api/roles/:id
 */
export async function getJobRoleById(roleId) {
  const res = await fetch(`${API_BASE_URL}/roles/${roleId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch role (${res.status})`);
  }
  return data;
}

/**
 * Fetch specific job role by unique slug
 * GET /api/roles/slug/:slug
 */
export async function getJobRoleBySlug(slug) {
  const res = await fetch(`${API_BASE_URL}/roles/slug/${slug}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to fetch role by slug (${res.status})`);
  }
  return data;
}

export default {
  checkBackendHealth,
  createCandidateProfile,
  uploadCandidateDocument,
  getCandidateProfile,
  getCandidateDocuments,
  getCandidateDocumentText,
  analyzeCandidateProfile,
  analyzeCandidateGithub,
  addCodingProfile,
  getCodingProfiles,
  refreshCodingProfile,
  deleteCodingProfile,
  getUnifiedProfile,
  updateCandidateProfile,
  addCandidateProject,
  addCandidateExperience,
  addCandidateCertification,
  addCandidateProfessionalProfile,
  addCandidatePortfolio,
  addCandidateAchievement,
  addCandidateAcademicAchievement,
  setCandidateTargetRole,
  startCandidateAnalysis,
  getAnalysisResult,
  checkAiServiceHealth,
  getAvailableJobRoles,
  getJobRoleById,
  getJobRoleBySlug,
};
