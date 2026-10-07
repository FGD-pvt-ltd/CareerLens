const mongoose = require('mongoose');

/**
 * Validate 24-character hexadecimal MongoDB ObjectId
 */
function isValidMongoId(id) {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate HTTP/HTTPS URLs
 */
function isValidUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const parsed = new URL(string);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate email address format
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Basic string sanitization
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * Normalize and clean URLs
 */
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

/**
 * Extract GitHub username from a URL or raw username string
 * Strictly disallows arbitrary GitHub API URLs
 */
function extractGithubUsername(input) {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim();

  // Reject arbitrary GitHub API URLs explicitly
  if (/api\.github\.com/i.test(cleaned)) {
    return null;
  }

  // If input is a URL (e.g., https://github.com/octocat)
  if (cleaned.includes('github.com')) {
    try {
      const parsed = new URL(normalizeUrl(cleaned));
      if (!/^(www\.)?github\.com$/i.test(parsed.hostname)) {
        return null;
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      // Valid profile URL has exactly one path segment representing the username
      if (parts.length !== 1) return null;
      const usernameCandidate = parts[0];

      // Disallow reserved GitHub paths
      const reserved = ['settings', 'explore', 'topics', 'marketplace', 'trending', 'login', 'features', 'pricing', 'about'];
      if (reserved.includes(usernameCandidate.toLowerCase())) return null;

      const usernameMatch = usernameCandidate.match(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/);
      return usernameMatch ? usernameMatch[0] : null;
    } catch {
      return null;
    }
  }

  // Raw username (1 to 39 alphanumeric chars or single hyphens, not starting/ending with hyphen)
  const usernameMatch = cleaned.match(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/);
  return usernameMatch ? usernameMatch[0] : null;
}

/**
 * Validate GitHub profile input specifically from request body
 */
function validateGithubProfileInput(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return { isValid: false, error: 'GitHub profile URL is required in githubUrl' };
  }
  const cleaned = input.trim();

  if (/api\.github\.com/i.test(cleaned)) {
    return {
      isValid: false,
      error: 'Arbitrary GitHub API URLs are not allowed. Please provide a standard GitHub profile URL (e.g. https://github.com/username)',
    };
  }

  const username = extractGithubUsername(cleaned);
  if (!username) {
    return {
      isValid: false,
      error: 'Invalid GitHub profile URL or username. Expected format: https://github.com/username',
    };
  }

  return { isValid: true, username, normalizedUrl: `https://github.com/${username}` };
}

module.exports = {
  isValidMongoId,
  isValidUrl,
  isValidEmail,
  sanitizeString,
  normalizeUrl,
  extractGithubUsername,
  validateGithubProfileInput,
};
