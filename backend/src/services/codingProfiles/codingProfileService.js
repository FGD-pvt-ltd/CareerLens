const { fetchCodeforcesProfile } = require('./codeforcesService');
const { fetchLeetcodeProfile } = require('./leetcodeService');
const { fetchHackerrankProfile } = require('./hackerrankService');
const { fetchCodechefProfile } = require('./codechefService');
const { fetchGeeksforgeeksProfile } = require('./geeksforgeeksService');

const PLATFORM_HANDLERS = {
  codeforces: fetchCodeforcesProfile,
  leetcode: fetchLeetcodeProfile,
  hackerrank: fetchHackerrankProfile,
  codechef: fetchCodechefProfile,
  geeksforgeeks: fetchGeeksforgeeksProfile,
};

/**
 * Dispatcher: routes platform to its dedicated service, normalizes result into common structure
 */
async function fetchAndNormalizeCodingProfile(platform, username, profileUrl) {
  const normalizedPlatform = (platform || '').trim().toLowerCase();
  const handler = PLATFORM_HANDLERS[normalizedPlatform];

  if (!handler) {
    const err = new Error(
      `Unsupported platform '${platform}'. Supported platforms: ${Object.keys(PLATFORM_HANDLERS).join(', ')}`
    );
    err.statusCode = 400;
    throw err;
  }

  const result = await handler(username, profileUrl);

  // Guarantee common structure schema compliance
  return {
    platform: normalizedPlatform,
    username: result.username || username,
    profileUrl: result.profileUrl || profileUrl,
    stats: {
      problemsSolved: typeof result.stats?.problemsSolved === 'number' ? result.stats.problemsSolved : null,
      rating: typeof result.stats?.rating === 'number' ? result.stats.rating : null,
      rank: typeof result.stats?.rank === 'number' ? result.stats.rank : null,
      contestsParticipated:
        typeof result.stats?.contestsParticipated === 'number' ? result.stats.contestsParticipated : null,
    },
    problemBreakdown: {
      easy: typeof result.problemBreakdown?.easy === 'number' ? result.problemBreakdown.easy : null,
      medium: typeof result.problemBreakdown?.medium === 'number' ? result.problemBreakdown.medium : null,
      hard: typeof result.problemBreakdown?.hard === 'number' ? result.problemBreakdown.hard : null,
    },
    languages: Array.isArray(result.languages) ? result.languages : [],
    activity: {
      lastActiveDate: result.activity?.lastActiveDate || null,
    },
    rawData: result.rawData || {},
    dataSource: result.dataSource || 'user_provided',
    fetchStatus: result.fetchStatus || 'pending',
    fetchedAt: result.fetchedAt || new Date(),
  };
}

module.exports = {
  fetchAndNormalizeCodingProfile,
  PLATFORM_HANDLERS,
};
