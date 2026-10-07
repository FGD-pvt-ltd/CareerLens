/**
 * AI Response Normalizer & Validator
 * 
 * Validates the raw response received from Aman's Python/FastAPI AI Service
 * and normalizes it into the exact structure required by the Analysis model.
 * 
 * Strict boundary:
 * Transports and formats only — does NOT compute scores, re-evaluate skills,
 * or alter the AI output in any way.
 */

class AIValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AIValidationError';
    this.statusCode = 502; // Bad Gateway from upstream AI service
  }
}

/**
 * Validate and normalize the FastAPI response payload.
 * 
 * @param {any} rawResponse - The parsed JSON body returned by FastAPI
 * @param {string} expectedCandidateId - The MongoDB candidate ID that was sent in request
 * @returns {object} Normalized analysis result payload ready for MongoDB persistence
 */
function validateAndNormalizeAiResponse(rawResponse, expectedCandidateId = null) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    throw new AIValidationError('Malformed AI service response: body is not a valid JSON object.');
  }

  // Unpack data if wrapped in { success: true, data: { ... } }
  let data = rawResponse.data !== undefined ? rawResponse.data : rawResponse;

  if (!data || typeof data !== 'object') {
    throw new AIValidationError('Malformed AI service response: "data" property is not an object.');
  }

  // 1. Verify candidateId
  const candidateId = data.candidateId || rawResponse.candidateId;
  if (!candidateId) {
    throw new AIValidationError('Missing required field "candidateId" in AI service response.');
  }
  if (expectedCandidateId && candidateId.toString() !== expectedCandidateId.toString()) {
    throw new AIValidationError(
      `Candidate ID mismatch in AI response: expected "${expectedCandidateId}", received "${candidateId}".`
    );
  }

  // 2. Validate readinessScore
  let readinessScore = null;
  const rawScore = data.readinessScore !== undefined ? data.readinessScore : data.score;
  if (rawScore !== undefined && rawScore !== null) {
    const numScore = Number(rawScore);
    if (isNaN(numScore)) {
      throw new AIValidationError(`Field "readinessScore" must be a numeric value, received: ${typeof rawScore}.`);
    }
    readinessScore = Math.round(numScore);
  }

  // 3. Validate and normalize arrays (skills, strengths, gaps, roadmap)
  if (data.skills !== undefined && !Array.isArray(data.skills)) {
    throw new AIValidationError('Field "skills" must be an array in AI service response.');
  }
  if (data.strengths !== undefined && !Array.isArray(data.strengths)) {
    throw new AIValidationError('Field "strengths" must be an array in AI service response.');
  }
  if (data.gaps !== undefined && !Array.isArray(data.gaps)) {
    throw new AIValidationError('Field "gaps" must be an array in AI service response.');
  }
  if (data.roadmap !== undefined && !Array.isArray(data.roadmap)) {
    throw new AIValidationError('Field "roadmap" must be an array in AI service response.');
  }

  const skills = Array.isArray(data.skills) ? data.skills : [];
  const strengths = Array.isArray(data.strengths) ? data.strengths : [];
  const gaps = Array.isArray(data.gaps) ? data.gaps : [];
  const roadmap = Array.isArray(data.roadmap) ? data.roadmap : [];

  // 4. Validate scoreBreakdown
  let scoreBreakdown = {};
  if (data.scoreBreakdown && typeof data.scoreBreakdown === 'object') {
    scoreBreakdown = data.scoreBreakdown;
  }

  // 5. Metadata
  const rawMeta = rawResponse.aiMetadata || rawResponse.metadata || data.aiMetadata || {};
  const aiMetadata = {
    serviceVersion: rawMeta.serviceVersion || rawMeta.version || '1.0.0',
    model: rawMeta.model || 'fastapi-ai-pipeline',
    analyzedAt: rawMeta.analyzedAt ? new Date(rawMeta.analyzedAt) : new Date(),
  };

  return {
    candidateId: candidateId.toString(),
    result: {
      readinessScore,
      scoreBreakdown,
      skills,
      strengths,
      gaps,
      roadmap,
    },
    aiMetadata,
  };
}

module.exports = {
  validateAndNormalizeAiResponse,
  AIValidationError,
};
