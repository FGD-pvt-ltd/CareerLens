/**
 * CodeChef Coding Platform Service
 * CodeChef does not provide an official unauthenticated public REST API.
 * Per project specification:
 * - Store profile URL and extracted username
 * - Set fetchStatus = 'unavailable' (or 'partial' if metadata accessible)
 * - Set dataSource = 'user_provided'
 * - Never fabricate or scrape fragile stats
 */
async function fetchCodechefProfile(username, profileUrl) {
  // Validate that username is not empty
  if (!username) {
    const err = new Error('CodeChef username is required.');
    err.statusCode = 400;
    throw err;
  }

  return {
    platform: 'codechef',
    username,
    profileUrl,
    stats: {
      problemsSolved: null,
      rating: null,
      rank: null,
      contestsParticipated: null,
    },
    problemBreakdown: {
      easy: null,
      medium: null,
      hard: null,
    },
    languages: [],
    activity: {
      lastActiveDate: null,
    },
    rawData: {
      notice: 'CodeChef does not expose a public REST API; profile recorded as verified external evidence source.',
    },
    dataSource: 'user_provided',
    fetchStatus: 'unavailable',
    fetchedAt: new Date(),
  };
}

module.exports = {
  fetchCodechefProfile,
};
