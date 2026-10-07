const CODEFORCES_API_BASE = 'https://codeforces.com/api';
const TIMEOUT_MS = 8000;

/**
 * Fetch and normalize candidate public data from Codeforces official API
 */
async function fetchCodeforcesProfile(username, profileUrl) {
  let userInfo = null;
  let ratingHistory = [];
  let userSubmissions = [];

  // 1. Fetch user.info
  try {
    const infoRes = await fetch(`${CODEFORCES_API_BASE}/user.info?handles=${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'ProfiQ-Backend/1.0',
      },
    });

    const infoData = await infoRes.json().catch(() => ({}));
    if (infoData.status !== 'OK' || !infoData.result || infoData.result.length === 0) {
      if (infoData.comment && infoData.comment.toLowerCase().includes('not found')) {
        const err = new Error(`Codeforces profile for username '${username}' not found.`);
        err.statusCode = 404;
        throw err;
      }
      const err = new Error(infoData.comment || 'Failed to fetch Codeforces profile.');
      err.statusCode = infoRes.status === 404 ? 404 : 502;
      throw err;
    }

    userInfo = infoData.result[0];
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(`Codeforces API unavailable: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  // 2. Fetch user.rating (contests participated)
  try {
    const ratingRes = await fetch(`${CODEFORCES_API_BASE}/user.rating?handle=${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'ProfiQ-Backend/1.0' },
    });
    const ratingData = await ratingRes.json().catch(() => ({}));
    if (ratingData.status === 'OK' && Array.isArray(ratingData.result)) {
      ratingHistory = ratingData.result;
    }
  } catch {
    // Non-fatal, ratingHistory stays []
  }

  // 3. Fetch user.status (recent submissions, problems solved, languages)
  try {
    const statusRes = await fetch(
      `${CODEFORCES_API_BASE}/user.status?handle=${encodeURIComponent(username)}&from=1&count=50`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'ProfiQ-Backend/1.0' },
      }
    );
    const statusData = await statusRes.json().catch(() => ({}));
    if (statusData.status === 'OK' && Array.isArray(statusData.result)) {
      userSubmissions = statusData.result;
    }
  } catch {
    // Non-fatal, submissions stays []
  }

  // Calculate unique solved problems & languages from submissions
  const solvedProblemIds = new Set();
  const languagesSet = new Set();
  let latestSubmissionTime = null;

  userSubmissions.forEach((sub) => {
    if (sub.verdict === 'OK' && sub.problem) {
      const problemKey = `${sub.problem.contestId || ''}-${sub.problem.index || ''}-${sub.problem.name || ''}`;
      solvedProblemIds.add(problemKey);
    }
    if (sub.programmingLanguage) {
      // Clean language label (e.g. "GNU C++20 (64)" -> "C++")
      const lang = sub.programmingLanguage.split(' ')[0].replace(/GNU/i, '').trim();
      languagesSet.add(lang || sub.programmingLanguage);
    }
    if (sub.creationTimeSeconds) {
      const subDate = new Date(sub.creationTimeSeconds * 1000);
      if (!latestSubmissionTime || subDate > latestSubmissionTime) {
        latestSubmissionTime = subDate;
      }
    }
  });

  const lastActiveDate =
    latestSubmissionTime || (userInfo.lastOnlineTimeSeconds ? new Date(userInfo.lastOnlineTimeSeconds * 1000) : null);

  return {
    platform: 'codeforces',
    username,
    profileUrl,
    stats: {
      problemsSolved: solvedProblemIds.size > 0 ? solvedProblemIds.size : null,
      rating: typeof userInfo.rating === 'number' ? userInfo.rating : null,
      rank: null,
      contestsParticipated: ratingHistory.length > 0 ? ratingHistory.length : null,
    },
    problemBreakdown: {
      easy: null,
      medium: null,
      hard: null,
    },
    languages: Array.from(languagesSet),
    activity: {
      lastActiveDate,
    },
    rawData: {
      handle: userInfo.handle,
      rankTier: userInfo.rank || null,
      maxRating: userInfo.maxRating || null,
      maxRankTier: userInfo.maxRank || null,
      contribution: userInfo.contribution || 0,
      registrationTime: userInfo.registrationTimeSeconds
        ? new Date(userInfo.registrationTimeSeconds * 1000)
        : null,
      contestsRecorded: ratingHistory.length,
      sampleSubmissionsCount: userSubmissions.length,
    },
    dataSource: 'official_api',
    fetchStatus: 'completed',
    fetchedAt: new Date(),
  };
}

module.exports = {
  fetchCodeforcesProfile,
};
