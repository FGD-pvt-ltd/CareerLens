/**
 * GeeksforGeeks Coding Platform Service
 * GeeksforGeeks does not provide an official unauthenticated public REST API.
 * Per project specification:
 * - Store profile URL and extracted username
 * - Set fetchStatus = 'unavailable'
 * - Set dataSource = 'user_provided'
 * - Never fabricate or invent numbers
 */
async function fetchGeeksforgeeksProfile(username, profileUrl) {
  if (!username) {
    const err = new Error('GeeksforGeeks username is required.');
    err.statusCode = 400;
    throw err;
  }

  return {
    platform: 'geeksforgeeks',
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
      notice: 'GeeksforGeeks does not expose an official public REST API; profile recorded as verified external evidence source.',
    },
    dataSource: 'user_provided',
    fetchStatus: 'unavailable',
    fetchedAt: new Date(),
  };
}

module.exports = {
  fetchGeeksforgeeksProfile,
};
