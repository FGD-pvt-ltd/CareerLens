const { normalizeUrl, isValidUrl } = require('../utils/validators');

/**
 * Normalize portfolio web presence into standard evidence structure
 */
function normalizePortfolioEvidence(portfolioUrl, candidateName = '') {
  if (!portfolioUrl || !isValidUrl(portfolioUrl)) return [];

  const cleanUrl = normalizeUrl(portfolioUrl);
  return [
    {
      sourceType: 'portfolio',
      sourceUrl: cleanUrl,
      skill: 'Web Development / Portfolio Presence',
      evidence: `Public live portfolio deployed for candidate ${candidateName || 'profile'}.`,
      strength: 'medium',
      metadata: {
        url: cleanUrl,
        type: 'personal-website',
      },
      timestamp: new Date(),
    },
  ];
}

/**
 * Normalize competitive programming / coding platform profiles
 */
function normalizeCodingProfiles(codingProfiles = []) {
  if (!Array.isArray(codingProfiles)) return [];

  const evidences = [];
  codingProfiles.forEach((item) => {
    if (item.url && isValidUrl(item.url)) {
      const cleanUrl = normalizeUrl(item.url);
      evidences.push({
        sourceType: 'coding_profile',
        sourceUrl: cleanUrl,
        skill: 'Data Structures & Algorithms',
        evidence: `Active problem-solving profile linked on platform: ${item.platform || 'Coding Platform'}.`,
        strength: 'medium',
        metadata: {
          platform: item.platform || 'unknown',
          url: cleanUrl,
        },
        timestamp: new Date(),
      });
    }
  });

  return evidences;
}

module.exports = {
  normalizePortfolioEvidence,
  normalizeCodingProfiles,
};
