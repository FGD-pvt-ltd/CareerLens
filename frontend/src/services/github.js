import { apiRequest } from './api';

/**
 * Trigger GitHub profile analysis and repository ingestion for candidate
 * POST /api/profiles/:id/github
 */
export async function analyzeCandidateGithub(profileId, githubUrl) {
  return apiRequest(`/profiles/${profileId}/github`, {
    method: 'POST',
    body: JSON.stringify({ githubUrl }),
  });
}

export default {
  analyzeCandidateGithub,
};
