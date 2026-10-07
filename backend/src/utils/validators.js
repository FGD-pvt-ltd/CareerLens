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
 */
function extractGithubUsername(input) {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim();
  
  // If input is a URL (e.g., https://github.com/torvalds)
  if (cleaned.includes('github.com')) {
    try {
      const parsed = new URL(normalizeUrl(cleaned));
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts.length > 0 ? parts[0] : null;
    } catch {
      return null;
    }
  }

  // Raw username (1 to 39 alphanumeric chars or single hyphens)
  const usernameMatch = cleaned.match(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/);
  return usernameMatch ? usernameMatch[0] : null;
}

module.exports = {
  isValidMongoId,
  isValidUrl,
  isValidEmail,
  sanitizeString,
  normalizeUrl,
  extractGithubUsername,
};
