const env = require('../config/env');
const { extractGithubUsername } = require('../utils/validators');

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Common request helper for official GitHub REST API v3
 */
async function fetchGithubApi(endpoint) {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ProfiQ-Career-Readiness-Analyzer/1.0.0',
  };

  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });

  if (response.status === 404) {
    const err = new Error('GitHub profile or resource not found.');
    err.statusCode = 404;
    throw err;
  }

  if (response.status === 403 || response.status === 429) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining === '0' || response.status === 429) {
      const err = new Error('GitHub API rate limit exceeded. Please configure a valid GITHUB_TOKEN in .env.');
      err.statusCode = 429;
      err.code = 'RATE_LIMIT_EXCEEDED';
      throw err;
    }
    const err = new Error('GitHub API access forbidden.');
    err.statusCode = 403;
    throw err;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const err = new Error(errorBody.message || `GitHub API error (HTTP ${response.status})`);
    err.statusCode = response.status;
    throw err;
  }

  return response.json();
}

/**
 * Generate structured fallback profile if GitHub rate limit is exceeded on unauthenticated IP
 */
function generateFallbackGithubData(username) {
  const mockRepos = [
    {
      id: 101,
      name: `${username}-portfolio`,
      fullName: `${username}/${username}-portfolio`,
      description: 'Personal developer showcase and career projects',
      htmlUrl: `https://github.com/${username}/${username}-portfolio`,
      language: 'JavaScript',
      stars: 3,
      forks: 1,
      isFork: false,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-09-01T00:00:00Z',
      pushedAt: '2024-09-01T00:00:00Z',
      topics: ['portfolio', 'react'],
      hasIssues: true,
      openIssuesCount: 0,
    },
    {
      id: 102,
      name: 'fullstack-web-app',
      fullName: `${username}/fullstack-web-app`,
      description: 'REST API backend service built with Node.js and Express',
      htmlUrl: `https://github.com/${username}/fullstack-web-app`,
      language: 'JavaScript',
      stars: 5,
      forks: 2,
      isFork: false,
      createdAt: '2024-03-10T00:00:00Z',
      updatedAt: '2024-10-01T00:00:00Z',
      pushedAt: '2024-10-01T00:00:00Z',
      topics: ['nodejs', 'express', 'api'],
      hasIssues: true,
      openIssuesCount: 1,
    },
  ];

  return {
    username,
    name: username,
    bio: 'Software Developer (Offline dev fallback)',
    avatarUrl: `https://avatars.githubusercontent.com/u/9919?v=4`,
    profileUrl: `https://github.com/${username}`,
    publicRepos: mockRepos.length,
    followers: 2,
    following: 5,
    accountCreatedAt: '2023-01-01T00:00:00Z',
    languageBreakdown: { JavaScript: 2 },
    repositories: mockRepos,
    normalizedEvidences: [
      {
        sourceType: 'github',
        sourceUrl: `https://github.com/${username}`,
        skill: 'JavaScript',
        evidence: `Authored 2 repository/repositories with JavaScript as primary language.`,
        strength: 'medium',
        metadata: { language: 'JavaScript', repositoryCount: 2, isDevFallback: true },
        timestamp: new Date(),
      },
    ],
    rateLimitNotice: 'Live GitHub request exceeded public unauthenticated limit. Add GITHUB_TOKEN to .env for 5,000 live requests/hr.',
  };
}

/**
 * Fetch and analyze a candidate's GitHub presence via official REST API
 */
async function fetchAndAnalyzeGithubProfile(input) {
  const username = extractGithubUsername(input);
  if (!username) {
    const err = new Error(`Invalid GitHub username or URL: '${input}'`);
    err.statusCode = 400;
    throw err;
  }

  let user;
  let rawRepos;

  try {
    // 1. Fetch User Profile
    user = await fetchGithubApi(`/users/${encodeURIComponent(username)}`);

    // 2. Fetch Public Repositories (sorted by recent push/update)
    rawRepos = await fetchGithubApi(`/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=15`);
  } catch (apiError) {
    // If rate limited without a GITHUB_TOKEN during development, provide normalized fallback
    if (apiError.code === 'RATE_LIMIT_EXCEEDED' && !env.GITHUB_TOKEN) {
      console.warn(`[GitHubService] Public rate limit reached. Using normalized fallback for '${username}'. Configure GITHUB_TOKEN in .env for live API.`);
      return generateFallbackGithubData(username);
    }
    throw apiError;
  }

  // 3. Process and normalize repository artifacts
  const repositories = (Array.isArray(rawRepos) ? rawRepos : []).map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description || '',
    htmlUrl: repo.html_url,
    language: repo.language || null,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    isFork: repo.fork,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    topics: repo.topics || [],
    hasIssues: repo.has_issues,
    openIssuesCount: repo.open_issues_count,
  }));

  // 4. Aggregate primary technologies and activity
  const languageCounts = {};
  repositories.forEach((r) => {
    if (r.language) {
      languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
    }
  });

  // 5. Build standardized evidence objects
  const normalizedEvidences = [];
  const nonForkRepos = repositories.filter((r) => !r.isFork);

  // Evidence for primary languages
  for (const [lang, count] of Object.entries(languageCounts)) {
    let strength = 'low';
    if (count >= 4) strength = 'high';
    else if (count >= 2) strength = 'medium';

    normalizedEvidences.push({
      sourceType: 'github',
      sourceUrl: `https://github.com/${username}?tab=repositories&q=&type=&language=${encodeURIComponent(lang.toLowerCase())}`,
      skill: lang,
      evidence: `Authored ${count} repository/repositories with ${lang} as the primary language on GitHub.`,
      strength,
      metadata: {
        language: lang,
        repositoryCount: count,
        source: 'github-repositories',
      },
      timestamp: new Date(),
    });
  }

  // Evidence for standout projects (non-forks with description/stars)
  const standoutProjects = nonForkRepos
    .filter((r) => r.description && (r.stars > 0 || r.topics.length > 0))
    .slice(0, 5);

  standoutProjects.forEach((proj) => {
    normalizedEvidences.push({
      sourceType: 'github',
      sourceUrl: proj.htmlUrl,
      skill: proj.language || 'Project Development',
      evidence: `Built project '${proj.name}': ${proj.description} (${proj.stars} stars, updated ${proj.updatedAt ? proj.updatedAt.slice(0, 10) : 'recently'})`,
      strength: proj.stars >= 5 ? 'high' : 'medium',
      metadata: {
        repoName: proj.name,
        stars: proj.stars,
        topics: proj.topics,
      },
      timestamp: new Date(),
    });
  });

  return {
    username: user.login,
    name: user.name || user.login,
    bio: user.bio || '',
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    accountCreatedAt: user.created_at,
    languageBreakdown: languageCounts,
    repositories,
    normalizedEvidences,
  };
}

module.exports = {
  fetchGithubApi,
  fetchAndAnalyzeGithubProfile,
};
