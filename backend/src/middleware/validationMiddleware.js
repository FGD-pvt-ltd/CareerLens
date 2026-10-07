const { isValidMongoId, isValidEmail, isValidUrl } = require('../utils/validators');
const { errorResponse } = require('../utils/response');

/**
 * Validate MongoDB ObjectId param
 */
function validateMongoIdParam(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !isValidMongoId(id)) {
      return errorResponse(res, `Invalid ID format: '${id}'. Must be a 24-character hexadecimal string.`, 400);
    }
    next();
  };
}

/**
 * Validate Candidate Profile creation / update payload
 */
function validateProfileBody(req, res, next) {
  const { name, email, githubUrl, portfolioUrl, codingProfiles } = req.body;

  // On POST creation, name and email are mandatory
  if (req.method === 'POST') {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return errorResponse(res, "Missing required field: 'name' is required.", 400);
    }
    if (!email || !isValidEmail(email)) {
      return errorResponse(res, "Valid 'email' address is required.", 400);
    }
  }

  // If email is provided during update, validate format
  if (email && !isValidEmail(email)) {
    return errorResponse(res, "Invalid 'email' format provided.", 400);
  }

  // Validate URLs if provided
  if (githubUrl && !isValidUrl(githubUrl) && !/^https?:\/\/github\.com\//i.test(githubUrl)) {
    return errorResponse(res, "Invalid 'githubUrl' provided. Must be a valid URL.", 400);
  }

  if (portfolioUrl && !isValidUrl(portfolioUrl)) {
    return errorResponse(res, "Invalid 'portfolioUrl' provided. Must be a valid HTTP/HTTPS URL.", 400);
  }

  if (codingProfiles && !Array.isArray(codingProfiles)) {
    return errorResponse(res, "'codingProfiles' must be an array of objects.", 400);
  }

  next();
}

/**
 * Validate Analysis creation payload
 */
function validateAnalysisBody(req, res, next) {
  const { candidateId, targetRole } = req.body;

  if (!candidateId) {
    return errorResponse(res, "Missing required field: 'candidateId' is required.", 400);
  }

  if (!isValidMongoId(candidateId)) {
    return errorResponse(res, "Invalid 'candidateId' format. Must be a valid 24-character hexadecimal ObjectId.", 400);
  }

  if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
    return errorResponse(res, "Missing required field: 'targetRole' (name or ID) is required.", 400);
  }

  next();
}

/**
 * Validate GitHub Analysis payload
 */
function validateGithubBody(req, res, next) {
  const { username, url, profileUrl } = req.body;
  const input = username || url || profileUrl;

  if (!input || typeof input !== 'string' || !input.trim()) {
    return errorResponse(res, "Missing required field: 'username' or GitHub profile 'url' is required.", 400);
  }

  next();
}

module.exports = {
  validateMongoIdParam,
  validateProfileBody,
  validateAnalysisBody,
  validateGithubBody,
};
