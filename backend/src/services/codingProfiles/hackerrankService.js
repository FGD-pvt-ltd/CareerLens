const HACKERRANK_API_BASE = 'https://www.hackerrank.com/rest/hackers';
const TIMEOUT_MS = 6000;

/**
 * Fetch and normalize candidate public data from HackerRank public endpoint
 */
async function fetchHackerrankProfile(username, profileUrl) {
  let badges = [];
  let fetchStatus = 'unavailable';
  let dataSource = 'user_provided';
  let rawData = {};

  try {
    const res = await fetch(`${HACKERRANK_API_BASE}/${encodeURIComponent(username)}/badges`, {
      headers: {
        'User-Agent': 'ProfiQ-Backend/1.0',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (res.status === 404) {
      const err = new Error(`HackerRank profile for username '${username}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.models)) {
        badges = data.models;
        fetchStatus = badges.length > 0 ? 'completed' : 'partial';
        dataSource = 'public_endpoint';
        rawData = { badgesCount: badges.length, badges: badges.map((b) => ({ badge_name: b.badge_name, stars: b.stars })) };
      }
    }
  } catch (err) {
    if (err.statusCode === 404) throw err;
    // Fallback if public endpoint is blocked or unavailable
    fetchStatus = 'unavailable';
    dataSource = 'user_provided';
    rawData = { notice: 'HackerRank public statistics unavailable or restricted' };
  }

  // Calculate languages from badges if present (e.g. C++, Python, Java badges)
  const languages = [];
  badges.forEach((b) => {
    if (b.badge_name && !languages.includes(b.badge_name)) {
      languages.push(b.badge_name);
    }
  });

  return {
    platform: 'hackerrank',
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
    languages,
    activity: {
      lastActiveDate: null,
    },
    rawData,
    dataSource,
    fetchStatus,
    fetchedAt: new Date(),
  };
}

module.exports = {
  fetchHackerrankProfile,
};
