const env = require('../config/env');
const { extractGithubUsername } = require('../utils/validators');

const GITHUB_API_BASE = 'https://api.github.com';
const API_TIMEOUT_MS = 10000;

/**
 * Common request helper for official GitHub REST API v3
 */
async function fetchGithubApi(endpoint, customHeaders = {}) {
  const token = env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ProfiQ-Career-Readiness-Analyzer/1.0.0',
    ...customHeaders,
  };

  if (token && typeof token === 'string' && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  let response;
  try {
    response = await fetch(`${GITHUB_API_BASE}${endpoint}`, {
      headers,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError') {
      const err = new Error('GitHub API request timed out.');
      err.statusCode = 504;
      throw err;
    }
    const err = new Error(`Failed to reach GitHub API: ${netErr.message}`);
    err.statusCode = 502;
    throw err;
  }

  if (response.status === 404) {
    const err = new Error('GitHub profile not found');
    err.statusCode = 404;
    throw err;
  }

  if (response.status === 403 || response.status === 429) {
    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const resetTimestamp = response.headers.get('x-ratelimit-reset');
    if (rateLimitRemaining === '0' || response.status === 429) {
      let resetInfo = '';
      if (resetTimestamp) {
        const resetDate = new Date(parseInt(resetTimestamp, 10) * 1000);
        resetInfo = ` Reset scheduled at ${resetDate.toLocaleTimeString()}.`;
      }
      const err = new Error(
        `GitHub API rate limit exceeded. Please configure a valid GITHUB_TOKEN in .env or try again later.${resetInfo}`
      );
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
 * Fetch README content for a repository where publicly available
 * Returns raw markdown text or empty string on 404/failure
 */
async function fetchRepoReadme(owner, repo) {
  const token = env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  const headers = {
    Accept: 'application/vnd.github.raw',
    'User-Agent': 'ProfiQ-Career-Readiness-Analyzer/1.0.0',
  };

  if (token && typeof token === 'string' && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      {
        headers,
        signal: AbortSignal.timeout(6000),
      }
    );

    if (response.ok) {
      const text = await response.text();
      // Cap at 15,000 characters to keep document storage clean and fast
      return text.length > 15000 ? text.slice(0, 15000) + '\n\n...[truncated for AI pipeline]' : text;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Fetch language breakdown for a repository
 */
async function fetchRepoLanguages(owner, repo) {
  try {
    const data = await fetchGithubApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`);
    if (data && typeof data === 'object') {
      return Object.keys(data);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch and analyze a candidate's GitHub profile data via official GitHub REST API
 * Strictly collects public profile, repositories, README context, language summary, and activity.
 * No AI evaluation or readiness scores are performed here.
 */
async function fetchAndAnalyzeGithubProfile(usernameInput) {
  const username = extractGithubUsername(usernameInput);
  if (!username) {
    const err = new Error(`Invalid GitHub username or profile URL: '${usernameInput}'`);
    err.statusCode = 400;
    throw err;
  }

  // 1. Fetch User Profile
  const user = await fetchGithubApi(`/users/${encodeURIComponent(username)}`);

  // 2. Fetch Public Repositories (sorted by recent push, limit to top 15)
  let rawRepos = [];
  try {
    rawRepos = await fetchGithubApi(
      `/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=15&type=all`
    );
  } catch (repoErr) {
    if (repoErr.statusCode === 404) {
      rawRepos = [];
    } else {
      throw repoErr;
    }
  }

  const safeRepos = Array.isArray(rawRepos) ? rawRepos : [];

  // Sort candidate repositories: prioritize own original repos, then by stars and recent push
  const sortedRepos = [...safeRepos].sort((a, b) => {
    if (a.fork !== b.fork) return a.fork ? 1 : -1; // non-forks first
    if ((b.stargazers_count || 0) !== (a.stargazers_count || 0)) {
      return (b.stargazers_count || 0) - (a.stargazers_count || 0);
    }
    return new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0);
  });

  // Limit processing to at most 10 repositories to stay efficient
  const targetRepos = sortedRepos.slice(0, 10);

  // 3. For the top 3 standout non-fork repositories, fetch README context
  // Select top 3 non-fork repos with description or stars or activity
  const standoutRepos = targetRepos.filter((r) => !r.fork).slice(0, 3);
  const readmePromises = standoutRepos.map(async (r) => {
    const readmeContent = await fetchRepoReadme(username, r.name);
    return { name: r.name, readme: readmeContent };
  });

  const readmeResults = await Promise.all(readmePromises);
  const readmeMap = {};
  readmeResults.forEach((item) => {
    readmeMap[item.name] = item.readme;
  });

  // 4. Normalize Repositories
  const repositories = targetRepos.map((repo) => {
    const langs = [];
    if (repo.language) {
      langs.push(repo.language);
    }

    return {
      name: repo.name,
      fullName: repo.full_name || `${username}/${repo.name}`,
      description: repo.description || '',
      url: repo.html_url,
      homepage: repo.homepage || '',
      primaryLanguage: repo.language || null,
      languages: langs,
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      createdAt: repo.created_at ? new Date(repo.created_at) : null,
      updatedAt: repo.updated_at ? new Date(repo.updated_at) : null,
      pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
      defaultBranch: repo.default_branch || 'main',
      archived: Boolean(repo.archived),
      fork: Boolean(repo.fork),
      readme: readmeMap[repo.name] || '',
    };
  });

  // 5. Aggregate Language Summary (across all fetched repositories)
  const languageSummary = {};
  safeRepos.forEach((repo) => {
    if (repo.language && typeof repo.language === 'string') {
      languageSummary[repo.language] = (languageSummary[repo.language] || 0) + 1;
    }
  });

  // 6. Aggregate Activity / Consistency Data
  let lastActiveDate = null;
  let recentRepositoryCount = 0;
  let totalStars = 0;
  let totalForks = 0;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  safeRepos.forEach((repo) => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    const activityDate = repo.pushed_at || repo.updated_at;
    if (activityDate) {
      const d = new Date(activityDate);
      if (!lastActiveDate || d > lastActiveDate) {
        lastActiveDate = d;
      }
      if (d >= ninetyDaysAgo) {
        recentRepositoryCount++;
      }
    }
  });

  // If user has updated profile recently, consider user updated date as fallback
  if (!lastActiveDate && user.updated_at) {
    lastActiveDate = new Date(user.updated_at);
  }

  // 7. Assemble normalized ProfiQ GitHub data object
  return {
    username: user.login,
    profileUrl: user.html_url,
    name: user.name || user.login,
    bio: user.bio || '',
    avatarUrl: user.avatar_url || '',
    company: user.company || '',
    location: user.location || '',
    publicRepositoryCount: typeof user.public_repos === 'number' ? user.public_repos : safeRepos.length,
    followers: user.followers || 0,
    following: user.following || 0,
    accountCreatedAt: user.created_at ? new Date(user.created_at) : null,
    repositories,
    languageSummary,
    activity: {
      lastActiveDate,
      recentRepositoryCount,
      totalStars,
      totalForks,
    },
    analyzedAt: new Date(),
  };
}

module.exports = {
  fetchGithubApi,
  fetchRepoReadme,
  fetchRepoLanguages,
  fetchAndAnalyzeGithubProfile,
};
