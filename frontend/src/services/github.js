import { apiRequest } from './api';

export async function fetchGithubProfile(username) {
  return apiRequest(`/profile/github/${username}`, {
    method: 'GET',
  });
}

export async function verifyGithubRepositories(username) {
  return apiRequest(`/profile/github/${username}/repos`, {
    method: 'GET',
  });
}

export default {
  fetchGithubProfile,
  verifyGithubRepositories,
};
