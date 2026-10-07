const { isValidUrl, normalizeUrl } = require('./validators');

const SUPPORTED_PLATFORMS = ['leetcode', 'codeforces', 'codechef', 'hackerrank', 'geeksforgeeks'];

const PLATFORM_CONFIG = {
  leetcode: {
    name: 'LeetCode',
    allowedHostnames: ['leetcode.com', 'www.leetcode.com'],
    extractUsername: (pathname) => {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 0) return null;
      if (parts[0] === 'u' && parts.length > 1) return parts[1];
      return parts[0];
    },
  },
  codeforces: {
    name: 'Codeforces',
    allowedHostnames: ['codeforces.com', 'www.codeforces.com'],
    extractUsername: (pathname) => {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 0) return null;
      if (parts[0] === 'profile' && parts.length > 1) return parts[1];
      return parts[0];
    },
  },
  codechef: {
    name: 'CodeChef',
    allowedHostnames: ['codechef.com', 'www.codechef.com'],
    extractUsername: (pathname) => {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 0) return null;
      if (parts[0] === 'users' && parts.length > 1) return parts[1];
      return parts[0];
    },
  },
  hackerrank: {
    name: 'HackerRank',
    allowedHostnames: ['hackerrank.com', 'www.hackerrank.com'],
    extractUsername: (pathname) => {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 0) return null;
      if (parts[0] === 'profile' && parts.length > 1) return parts[1];
      return parts[0];
    },
  },
  geeksforgeeks: {
    name: 'GeeksforGeeks',
    allowedHostnames: ['geeksforgeeks.org', 'www.geeksforgeeks.org', 'auth.geeksforgeeks.org'],
    extractUsername: (pathname) => {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 0) return null;
      if ((parts[0] === 'user' || parts[0] === 'profile') && parts.length > 1) return parts[1];
      return parts[0];
    },
  },
};

/**
 * Validate incoming platform and profile URL, verifying domain match and username extraction
 */
function validateCodingProfileInput(platformInput, profileUrlInput) {
  if (!platformInput || typeof platformInput !== 'string' || !platformInput.trim()) {
    return {
      isValid: false,
      error: `Platform is required. Supported platforms are: ${SUPPORTED_PLATFORMS.join(', ')}`,
    };
  }

  const platform = platformInput.trim().toLowerCase();
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return {
      isValid: false,
      error: `Unsupported platform '${platformInput}'. Allowed values: ${SUPPORTED_PLATFORMS.join(', ')}`,
    };
  }

  if (!profileUrlInput || typeof profileUrlInput !== 'string' || !profileUrlInput.trim()) {
    return {
      isValid: false,
      error: 'Profile URL is required in profileUrl',
    };
  }

  const cleanedUrl = normalizeUrl(profileUrlInput.trim());
  if (!isValidUrl(cleanedUrl)) {
    return {
      isValid: false,
      error: `Invalid profile URL: '${profileUrlInput}'`,
    };
  }

  let parsed;
  try {
    parsed = new URL(cleanedUrl);
  } catch {
    return {
      isValid: false,
      error: `Malformed profile URL: '${profileUrlInput}'`,
    };
  }

  const config = PLATFORM_CONFIG[platform];
  const hostname = parsed.hostname.toLowerCase();
  if (!config.allowedHostnames.includes(hostname)) {
    return {
      isValid: false,
      error: `URL hostname '${hostname}' does not match platform '${platform}'. Expected ${config.allowedHostnames.join(' or ')}`,
    };
  }

  const username = config.extractUsername(parsed.pathname);
  if (!username || !username.trim()) {
    return {
      isValid: false,
      error: `Could not extract username from profile URL: '${profileUrlInput}'`,
    };
  }

  // Sanitize username (strip query, hashes, trailing punctuation)
  const cleanUsername = username.trim().replace(/[/?#].*$/, '');

  return {
    isValid: true,
    platform,
    profileUrl: cleanedUrl,
    username: cleanUsername,
  };
}

module.exports = {
  SUPPORTED_PLATFORMS,
  PLATFORM_CONFIG,
  validateCodingProfileInput,
};
