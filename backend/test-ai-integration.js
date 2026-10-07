/**
 * Automated Verification Suite for Node.js ↔ Python/FastAPI AI Integration
 * 
 * Tests the complete integration layer without requiring Aman's production service:
 * 1. Health check (available vs unavailable)
 * 2. Candidate validation & target role checks
 * 3. Payload serialization & transport
 * 4. Response validation & normalization
 * 5. MongoDB Analysis document persistence
 * 6. Retrieval via GET /api/analysis/:id
 * 7. Duplicate analysis handling
 * 8. Upstream timeout handling
 * 9. Upstream 500 error handling
 * 10. Malformed/invalid AI response rejection
 */

const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const env = require('./src/config/env');
const CandidateProfile = require('./src/models/CandidateProfile');
const Analysis = require('./src/models/Analysis');

function makeRequest(port, method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: 'localhost',
      port,
      path: pathUrl,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(rawData);
        } catch {
          parsed = rawData;
        }
        resolve({
          status: res.statusCode,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runAIIntegrationTests() {
  console.log('\n====================================================');
  console.log(' PROFIQ NODE.JS ↔ PYTHON/FASTAPI AI INTEGRATION SUITE');
  console.log('====================================================\n');

  const TEST_SERVER_PORT = 61410;
  const MOCK_FASTAPI_PORT = 61411;

  let testServer;
  let mockFastApiServer;
  let passed = 0;
  let failed = 0;

  // Mock server behavior controller
  let mockMode = 'normal'; // 'normal', 'timeout', 'error500', 'invalid_json', 'bad_score'
  let receivedAiPayload = null;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // 1. Start isolated Mock FastAPI Server
    mockFastApiServer = http.createServer((req, res) => {
      let bodyData = '';
      req.on('data', (c) => (bodyData += c));
      req.on('end', () => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ status: 'ok', service: 'profiq-ai-fastapi', version: '1.0.0' }));
        }

        if (req.url === '/api/analyze' && req.method === 'POST') {
          try {
            receivedAiPayload = JSON.parse(bodyData);
          } catch {
            receivedAiPayload = null;
          }

          if (mockMode === 'timeout') {
            // Intentionally don't respond to trigger Node timeout
            return;
          }

          if (mockMode === 'error500') {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ detail: 'Internal AI Model inference failed' }));
          }

          if (mockMode === 'invalid_json') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            return res.end('NON_JSON_CORRUPTED_STREAM');
          }

          if (mockMode === 'bad_score') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({
              success: true,
              data: {
                candidateId: receivedAiPayload?.candidateId,
                readinessScore: 'NOT_A_NUMBER',
              },
            }));
          }

          // Normal valid FastAPI response
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            success: true,
            data: {
              candidateId: receivedAiPayload?.candidateId,
              readinessScore: 84,
              scoreBreakdown: {
                skillAlignment: 88,
                projectEvidence: 82,
                codingRigor: 85,
                academicRigor: 78,
              },
              skills: [
                { name: 'Node.js', level: 'Advanced' },
                { name: 'Distributed Systems', level: 'Intermediate' },
              ],
              strengths: [
                'Strong asynchronous backend architecture skills',
                'Demonstrated competitive programming problem solving',
              ],
              gaps: [
                { skill: 'Kubernetes', severity: 'medium' },
              ],
              roadmap: [
                { step: '1', title: 'Containerize microservices', duration: 'Week 1', status: 'Next' },
              ],
            },
            metadata: {
              serviceVersion: '1.0.0',
              model: 'gemini-1.5-pro',
              analyzedAt: new Date().toISOString(),
            },
          }));
        }

        res.writeHead(404);
        res.end();
      });
    });

    await new Promise((resolve) => mockFastApiServer.listen(MOCK_FASTAPI_PORT, resolve));
    console.log(`[Mock FastAPI] Server running on port ${MOCK_FASTAPI_PORT}`);

    // Point Node AI client to our mock server and set short timeout for testing
    env.AI_SERVICE_URL = `http://localhost:${MOCK_FASTAPI_PORT}`;
    env.AI_SERVICE_TIMEOUT_MS = 1500; // 1.5s timeout for fast test execution
    env.MOCK_AI_SERVICE = false; // Test real HTTP transport

    // 2. Connect DB and start Express backend
    await connectDB();
    testServer = await new Promise((resolve) => {
      const s = app.listen(TEST_SERVER_PORT, () => resolve(s));
    });
    console.log(`[Test Server] Express running on port ${TEST_SERVER_PORT}`);

    // Test 1: Health check when FastAPI is available
    console.log('\n--- Test 1: AI Service Health Check (Available) ---');
    const healthRes = await makeRequest(TEST_SERVER_PORT, 'GET', '/api/ai/health');
    assert(
      healthRes.status === 200 &&
      healthRes.data?.success === true &&
      healthRes.data?.data?.aiService === 'available',
      'Test 1: GET /api/ai/health returns 200 available'
    );

    // Test 2: Health check when FastAPI is unavailable
    console.log('\n--- Test 2: AI Service Health Check (Unavailable) ---');
    env.AI_SERVICE_URL = 'http://localhost:61499'; // Dead port
    const healthDownRes = await makeRequest(TEST_SERVER_PORT, 'GET', '/api/ai/health');
    assert(
      healthDownRes.status === 503 &&
      healthDownRes.data?.success === false &&
      healthDownRes.data?.error === 'AI service unreachable',
      'Test 2: GET /api/ai/health returns 503 when service is offline'
    );
    env.AI_SERVICE_URL = `http://localhost:${MOCK_FASTAPI_PORT}`; // Restore mock port

    // Setup: Create test candidate profile
    const candidateDoc = new CandidateProfile({
      basicInfo: {
        name: 'Aman AI Integration Tester',
        email: `ai_test_${Date.now()}@example.com`,
      },
      college: {
        collegeName: 'National Institute of Tech',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduationYear: 2025,
      },
      projects: [
        {
          name: 'Real-time WebSocket Engine',
          description: 'Pub-sub engine with Redis streams',
          technologies: ['Node.js', 'Redis', 'WebSockets'],
        },
      ],
      codingProfiles: [
        {
          platform: 'leetcode',
          username: 'tourist',
          profileUrl: 'https://leetcode.com/u/tourist/',
          stats: { problemsSolved: 350, rating: 1950 },
          dataSource: 'public_endpoint',
          fetchStatus: 'completed',
        },
      ],
      targetRole: {
        roleId: 'backend_developer',
        roleName: 'Backend Developer',
      },
    });
    await candidateDoc.save();
    const candidateId = candidateDoc._id.toString();

    // Test 3: Validation - Invalid Candidate ID
    console.log('\n--- Test 3: Validation - Malformed ID ---');
    const badIdRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis', {
      candidateId: 'invalid-id-xyz',
    });
    assert(
      badIdRes.status === 400 && badIdRes.data?.success === false,
      'Test 3: Malformed candidateId rejected with 400'
    );

    // Test 4: Validation - Nonexistent Candidate
    console.log('\n--- Test 4: Validation - Nonexistent Candidate ---');
    const notFoundRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis', {
      candidateId: '650000000000000000000000',
    });
    assert(
      notFoundRes.status === 404 && notFoundRes.data?.success === false,
      'Test 4: Nonexistent candidate rejected with 404'
    );

    // Test 5: Validation - Missing Target Role
    console.log('\n--- Test 5: Validation - Missing Target Role ---');
    const noRoleDoc = new CandidateProfile({
      basicInfo: { name: 'No Role Candidate' },
    });
    await noRoleDoc.save();
    const noRoleRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis', {
      candidateId: noRoleDoc._id.toString(),
    });
    assert(
      noRoleRes.status === 400 && noRoleRes.data?.error.includes('Target role is required'),
      'Test 5: Profile without target role returns 400'
    );

    // Test 6: Valid POST /api/analysis (Sync test with Mock FastAPI)
    console.log('\n--- Test 6: Valid Analysis Request & Transport ---');
    mockMode = 'normal';
    receivedAiPayload = null;

    const startRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis?sync=true', {
      candidateId,
      targetRole: {
        roleId: 'backend_developer',
        roleName: 'Backend Developer',
      },
    });

    assert(startRes.status === 200, 'Test 6a: POST /api/analysis returns 200 on sync completion');
    const analysisId = startRes.data?.data?.analysisId;
    assert(Boolean(analysisId), 'Test 6b: Analysis record created with ID', analysisId);

    // Verify payload sent by Node to FastAPI
    assert(Boolean(receivedAiPayload), 'Test 6c: FastAPI received payload from Node');
    assert(receivedAiPayload?.candidateId === candidateId, 'Test 6d: Correct candidateId transmitted');
    assert(receivedAiPayload?.targetRole?.roleName === 'Backend Developer', 'Test 6e: Correct targetRole transmitted');
    assert(Boolean(receivedAiPayload?.profile?.basicInfo?.name), 'Test 6f: Unified candidate profile transmitted');
    assert(receivedAiPayload?.profile?.codingProfiles?.length === 1, 'Test 6g: Coding profiles evidence transmitted');

    // Test 7: GET /api/analysis/:id
    console.log('\n--- Test 7: GET /api/analysis/:id ---');
    const getAnalysisRes = await makeRequest(TEST_SERVER_PORT, 'GET', `/api/analysis/${analysisId}`);
    assert(getAnalysisRes.status === 200, 'Test 7a: GET /api/analysis/:id returns 200');
    const a = getAnalysisRes.data?.data?.analysis;
    assert(a?.status === 'completed', 'Test 7b: Analysis status is "completed"');
    assert(a?.result?.readinessScore === 84, 'Test 7c: readinessScore (84) accurately stored without alteration');
    assert(a?.result?.skills?.length === 2, 'Test 7d: skills array accurately stored');
    assert(a?.result?.strengths?.length === 2, 'Test 7e: strengths array stored');
    assert(a?.result?.gaps?.length === 1, 'Test 7f: gaps array stored');
    assert(a?.result?.roadmap?.length === 1, 'Test 7g: roadmap array stored');
    assert(a?.aiMetadata?.model === 'gemini-1.5-pro', 'Test 7h: aiMetadata model stored');

    // Test 8: Duplicate Processing Prevention
    console.log('\n--- Test 8: Duplicate Analysis Prevention ---');
    // Create an analysis record in 'processing' status
    const inFlightAnalysis = new Analysis({
      candidateId,
      targetRole: { roleId: 'backend_developer', roleName: 'Backend Developer' },
      status: 'processing',
    });
    await inFlightAnalysis.save();

    const dupRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis', {
      candidateId,
      targetRole: { roleId: 'backend_developer', roleName: 'Backend Developer' },
    });

    assert(dupRes.status === 200, 'Test 8a: Duplicate analysis request handled with 200');
    assert(
      dupRes.data?.data?.analysisId === inFlightAnalysis._id.toString() &&
      dupRes.data?.data?.status === 'processing',
      'Test 8b: Existing processing analysisId returned without re-dispatching AI call'
    );
    // Cleanup inFlightAnalysis
    await Analysis.findByIdAndDelete(inFlightAnalysis._id);

    // Test 9: Timeout Handling
    console.log('\n--- Test 9: Timeout Handling ---');
    mockMode = 'timeout';
    const timeoutRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis?sync=true', {
      candidateId,
    });
    assert(timeoutRes.status === 200, 'Test 9a: Request handled without crashing');
    const timeoutAnalysis = timeoutRes.data?.data?.analysis;
    assert(timeoutAnalysis?.status === 'failed', 'Test 9b: Analysis marked with status "failed"');
    assert(
      timeoutAnalysis?.error && timeoutAnalysis.error.includes('timed out'),
      'Test 9c: Safe timeout error message recorded'
    );

    // Test 10: Upstream 500 Error Handling
    console.log('\n--- Test 10: Upstream 500 Error Handling ---');
    mockMode = 'error500';
    const err500Res = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis?sync=true', {
      candidateId,
    });
    const err500Analysis = err500Res.data?.data?.analysis;
    assert(err500Analysis?.status === 'failed', 'Test 10a: Analysis marked with status "failed" on 500');
    assert(
      err500Analysis?.error && err500Analysis.error.includes('AI service responded with error'),
      'Test 10b: Upstream error message captured safely'
    );

    // Test 11: Invalid Non-JSON Response Rejection
    console.log('\n--- Test 11: Invalid Non-JSON Response Rejection ---');
    mockMode = 'invalid_json';
    const invalidJsonRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis?sync=true', {
      candidateId,
    });
    const invalidJsonAnalysis = invalidJsonRes.data?.data?.analysis;
    assert(invalidJsonAnalysis?.status === 'failed', 'Test 11a: Non-JSON response rejected');
    assert(
      invalidJsonAnalysis?.error && invalidJsonAnalysis.error.includes('non-JSON'),
      'Test 11b: Non-JSON error safely recorded'
    );

    // Test 12: Bad/Corrupted Score Rejection
    console.log('\n--- Test 12: Malformed AI Score Rejection ---');
    mockMode = 'bad_score';
    const badScoreRes = await makeRequest(TEST_SERVER_PORT, 'POST', '/api/analysis?sync=true', {
      candidateId,
    });
    const badScoreAnalysis = badScoreRes.data?.data?.analysis;
    assert(badScoreAnalysis?.status === 'failed', 'Test 12a: Malformed score rejected');
    assert(
      badScoreAnalysis?.error && badScoreAnalysis.error.includes('readinessScore'),
      'Test 12b: Schema validation failure recorded'
    );

  } catch (err) {
    console.error('Test Suite Exception:', err);
    failed++;
  } finally {
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
    if (mockFastApiServer) {
      await new Promise((resolve) => mockFastApiServer.close(resolve));
    }
    await mongoose.disconnect();
  }

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAIIntegrationTests().catch((err) => {
  console.error('Execution Failed:', err);
  process.exit(1);
});
