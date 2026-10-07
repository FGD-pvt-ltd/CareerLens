const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';
const TIMEOUT_MS = 8000;

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
    }
  }
`;

/**
 * Fetch and normalize candidate public data from LeetCode public GraphQL API
 */
async function fetchLeetcodeProfile(username, profileUrl) {
  let data;

  try {
    const res = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProfiQ-Backend/1.0',
        Referer: 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: USER_PROFILE_QUERY,
        variables: { username },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (res.status === 404) {
      const err = new Error(`LeetCode profile for username '${username}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (!res.ok) {
      throw new Error(`LeetCode HTTP error ${res.status}`);
    }

    data = await res.json();
  } catch (err) {
    if (err.statusCode === 404) throw err;

    // If LeetCode public API is blocked/down, preserve profile as external evidence source
    return {
      platform: 'leetcode',
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
      rawData: { notice: 'LeetCode public endpoint unavailable or rate limited' },
      dataSource: 'user_provided',
      fetchStatus: 'unavailable',
      fetchedAt: new Date(),
    };
  }

  const matchedUser = data?.data?.matchedUser;
  if (!matchedUser) {
    const err = new Error(`LeetCode profile for username '${username}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  const contest = data?.data?.userContestRanking || {};
  const acList = matchedUser?.submitStatsGlobal?.acSubmissionNum || [];

  let totalSolved = null;
  let easySolved = null;
  let mediumSolved = null;
  let hardSolved = null;

  acList.forEach((item) => {
    const diff = item.difficulty ? item.difficulty.toLowerCase() : '';
    if (diff === 'all') totalSolved = item.count;
    else if (diff === 'easy') easySolved = item.count;
    else if (diff === 'medium') mediumSolved = item.count;
    else if (diff === 'hard') hardSolved = item.count;
  });

  return {
    platform: 'leetcode',
    username: matchedUser.username || username,
    profileUrl,
    stats: {
      problemsSolved: totalSolved,
      rating: contest.rating ? Math.round(contest.rating) : null,
      rank: matchedUser.profile?.ranking || contest.globalRanking || null,
      contestsParticipated: contest.attendedContestsCount || null,
    },
    problemBreakdown: {
      easy: easySolved,
      medium: mediumSolved,
      hard: hardSolved,
    },
    languages: [],
    activity: {
      lastActiveDate: null,
    },
    rawData: {
      ranking: matchedUser.profile?.ranking || null,
      contestRanking: contest.globalRanking || null,
      reputation: matchedUser.profile?.reputation || 0,
      acSubmissionNum: acList,
    },
    dataSource: 'public_endpoint',
    fetchStatus: 'completed',
    fetchedAt: new Date(),
  };
}

module.exports = {
  fetchLeetcodeProfile,
};
