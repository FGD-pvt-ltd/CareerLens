const env = require('../config/env');
const { validateAndNormalizeAiResponse } = require('../utils/aiResponseNormalizer');

/**
 * AI Client Service
 * 
 * Manages HTTP communication between Node.js and Aman's Python/FastAPI AI Service.
 * Transports payloads, handles timeouts, validates responses, and normalizes output.
 * Does NOT contain AI/LLM interpretation logic.
 */

/**
 * Check connectivity and health of the Python/FastAPI AI service
 * GET ${AI_SERVICE_URL}/health
 */
async function checkAiHealth() {
  const healthUrl = `${env.AI_SERVICE_URL.replace(/\/+$/, '')}/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { available: true };
    }

    return {
      available: false,
      error: `AI service returned HTTP ${res.status}`,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    return {
      available: false,
      error: isTimeout ? 'AI service health check timed out' : 'AI service unreachable',
    };
  }
}

/**
 * Send normalized candidate evidence to FastAPI for AI evaluation.
 * POST ${AI_SERVICE_URL}/api/analyze
 * 
 * @param {object} aiPayload - Normalized unified candidate profile and target role
 * @returns {Promise<object>} Normalized AI response
 */
async function analyzeCandidateProfile(aiPayload) {
  if (!aiPayload || !aiPayload.candidateId) {
    throw new Error('Invalid AI request payload: candidateId is required.');
  }

  const candidateId = aiPayload.candidateId;
  const targetRoleName = aiPayload.targetRole?.roleName || 'Unspecified Role';

  // Development mock mode: strictly isolated for dev/test when FastAPI is not running
  if (env.MOCK_AI_SERVICE) {
    console.log(`[AI Service] (DEVELOPMENT MOCK ONLY) Simulating AI analysis for candidateId=${candidateId}`);
    return validateAndNormalizeAiResponse(
      {
        success: true,
        data: {
          candidateId: candidateId.toString(),
          readinessScore: 78,
          scoreBreakdown: {
            skillConfidence: 80,
            projectEvidence: 75,
            codingRigor: 82,
            academicRigor: 70,
          },
          skills: ['Node.js', 'Express', 'MongoDB', 'System Design'],
          strengths: ['Solid full stack fundamentals', 'Production repository structure'],
          gaps: ['Container orchestration (Kubernetes)', 'CI/CD pipeline automation'],
          roadmap: [
            { step: '1', title: 'Add Docker containerization', duration: 'Week 1', status: 'Next' },
            { step: '2', title: 'Deploy on cloud provider', duration: 'Week 2', status: 'Planned' },
          ],
        },
        metadata: {
          serviceVersion: '1.0.0-mock',
          model: 'DEVELOPMENT_MOCK_ONLY',
          analyzedAt: new Date().toISOString(),
        },
      },
      candidateId
    );
  }

  const endpointUrl = `${env.AI_SERVICE_URL.replace(/\/+$/, '')}/api/analyze`;
  const timeoutMs = env.AI_SERVICE_TIMEOUT_MS || 15000;

  console.log(`[AI Service] AI request started for candidateId=${candidateId}, targetRole="${targetRoleName}"`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(aiPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const rawText = await res.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(rawText);
    } catch {
      throw new Error(`AI service returned invalid non-JSON response (HTTP ${res.status}): ${rawText.slice(0, 150)}`);
    }

    if (!res.ok) {
      const errMsg = jsonResponse?.error || jsonResponse?.detail || jsonResponse?.message || `HTTP ${res.status}`;
      throw new Error(`AI service responded with error: ${errMsg}`);
    }

    // Validate and normalize raw response
    const normalized = validateAndNormalizeAiResponse(jsonResponse, candidateId);

    console.log(`[AI Service] AI request completed for candidateId=${candidateId}`);
    return normalized;
  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    const safeErrorMessage = isTimeout
      ? `AI service request timed out after ${timeoutMs}ms`
      : err.message || 'AI service connection failed';

    console.error(`[AI Service] AI request failed for candidateId=${candidateId}: ${safeErrorMessage}`);

    const error = new Error(safeErrorMessage);
    error.isTimeout = isTimeout;
    error.statusCode = isTimeout ? 504 : 502;
    throw error;
  }
}

module.exports = {
  checkAiHealth,
  analyzeCandidateProfile,
};
