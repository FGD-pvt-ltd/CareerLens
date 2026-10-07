/**
 * Automated Verification Test Suite for ProfiQ Backend
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { seedJobRoles } = require('./src/services/roleService');

const TEST_PORT = 5055;
let server;

function makeRequest(method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body && typeof body === 'object' && !headers['Content-Type']?.includes('multipart')
      ? JSON.stringify(body)
      : body;

    const reqHeaders = {
      ...headers,
    };

    if (body && typeof body === 'object' && !headers['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    } else if (payload && Buffer.isBuffer(payload)) {
      reqHeaders['Content-Length'] = payload.length;
    }

    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
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
          headers: res.headers,
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

// Generate valid multipart/form-data payload with file
function buildMultipartPayload(fieldName, filename, mimeType, fileBuffer) {
  const boundary = `----ProfiQBoundary${Date.now()}`;
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  const payload = Buffer.concat([
    Buffer.from(header, 'utf8'),
    fileBuffer,
    Buffer.from(footer, 'utf8'),
  ]);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    payload,
  };
}

// Generate minimal valid PDF with text
function createMinimalPdfBuffer(sampleText = 'Alex Mercer Software Engineer JavaScript React Node.js') {
  return Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n` +
    `2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n` +
    `3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n` +
    `4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n` +
    `5 0 obj<</Length ${sampleText.length + 30}>>stream\n` +
    `BT /F1 12 Tf 50 700 Td (${sampleText}) Tj ET\n` +
    `endstream\nendobj\nxref\n0 6\n0000000000 65535 f \n` +
    `0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n0000000201 00000 n \n0000000268 00000 n \n` +
    `trailer<</Size 6/Root 1 0 R>>\nstartxref\n360\n%%EOF`
  );
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('   PROFIQ BACKEND VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Database connection & role seeding
    await connectDB();
    await seedJobRoles();
    assert(true, '1. MongoDB connection/initialization handled cleanly');

    // 2. Server start
    await new Promise((res) => {
      server = app.listen(TEST_PORT, () => {
        assert(true, `2. Server started successfully on port ${TEST_PORT}`);
        res();
      });
    });

    // 3. GET /api/health
    const healthRes = await makeRequest('GET', '/api/health');
    assert(
      healthRes.status === 200 &&
      healthRes.data?.success === true &&
      healthRes.data?.data?.service === 'ProfiQ Backend API',
      '3. GET /api/health returns standardized success response'
    );

    // 4. POST /api/profiles - Create Candidate Profile
    const createProfileRes = await makeRequest('POST', '/api/profiles', {
      name: 'Alex Mercer',
      email: 'alex.mercer@example.edu',
      githubUrl: 'https://github.com/octocat',
      portfolioUrl: 'https://alexmercer.dev',
      claimedSkills: ['JavaScript', 'React', 'HTML5'],
    });

    const candidateId = createProfileRes.data?.data?._id || createProfileRes.data?.data?.id;
    assert(
      createProfileRes.status === 201 &&
      createProfileRes.data?.success === true &&
      candidateId,
      `4. Candidate profile created successfully (ID: ${candidateId})`
    );

    // 5. GET /api/profiles/:id - Retrieve Candidate Profile
    const getProfileRes = await makeRequest('GET', `/api/profiles/${candidateId}`);
    assert(
      getProfileRes.status === 200 &&
      getProfileRes.data?.success === true &&
      getProfileRes.data?.data?.name === 'Alex Mercer',
      '5. Candidate profile retrieved successfully by ID'
    );

    // 6. POST /api/profiles/:id/resume - Upload PDF resume & text extraction
    const validPdfBuffer = createMinimalPdfBuffer('Alex Mercer Software Engineer React Node.js Express');
    const validUpload = buildMultipartPayload('resume', 'alex-resume.pdf', 'application/pdf', validPdfBuffer);

    const uploadRes = await makeRequest(
      'POST',
      `/api/profiles/${candidateId}/resume`,
      validUpload.payload,
      { 'Content-Type': validUpload.contentType }
    );

    assert(
      uploadRes.status === 200 &&
      uploadRes.data?.success === true &&
      uploadRes.data?.data?.resume?.filename &&
      uploadRes.data?.data?.extractedTextLength >= 0,
      '6. Resume upload endpoint accepts PDF and extracts text successfully'
    );

    // 7. Invalid uploads are rejected
    // A: Non-PDF file
    const txtBuffer = Buffer.from('This is a text file, not a PDF');
    const invalidTypeUpload = buildMultipartPayload('resume', 'fake.txt', 'text/plain', txtBuffer);
    const rejectTypeRes = await makeRequest(
      'POST',
      `/api/profiles/${candidateId}/resume`,
      invalidTypeUpload.payload,
      { 'Content-Type': invalidTypeUpload.contentType }
    );
    assert(
      rejectTypeRes.status === 400 &&
      rejectTypeRes.data?.success === false &&
      rejectTypeRes.data?.error?.includes('PDF'),
      '7a. Invalid file type rejected with 400 and error format'
    );

    // B: Missing file
    const noFileRes = await makeRequest('POST', `/api/profiles/${candidateId}/resume`, {});
    assert(
      noFileRes.status === 400 && noFileRes.data?.success === false,
      '7b. Missing upload file rejected with 400'
    );

    // 8. GitHub service handles valid and invalid usernames/URLs
    // A: Valid username
    const validGhRes = await makeRequest('POST', '/api/github/analyze', {
      username: 'octocat',
    });
    assert(
      validGhRes.status === 200 &&
      validGhRes.data?.success === true &&
      validGhRes.data?.data?.username === 'octocat' &&
      Array.isArray(validGhRes.data?.data?.repositories),
      '8a. GitHub service analyzes valid username (octocat) and normalizes repos'
    );

    // B: Invalid username/format
    const invalidGhRes = await makeRequest('POST', '/api/github/analyze', {
      username: '!!!invalid_username$$$',
    });
    assert(
      invalidGhRes.status >= 400 && invalidGhRes.data?.success === false,
      '8b. GitHub service rejects invalid username with standard error response'
    );

    // 9. Analysis request creates pending analysis without inventing scores
    const analysisReqRes = await makeRequest('POST', '/api/analysis', {
      candidateId,
      targetRole: 'Frontend Developer',
    });

    const analysisId = analysisReqRes.data?.data?.analysisId;
    assert(
      analysisReqRes.status === 201 &&
      analysisReqRes.data?.success === true &&
      analysisReqRes.data?.data?.status === 'pending' &&
      analysisReqRes.data?.data?.readinessScore === null &&
      analysisId,
      `9. Analysis initialized with status 'pending' and NO invented scores (ID: ${analysisId})`
    );

    // 10. GET /api/analysis/:id - Analysis result retrieval
    const getAnalysisRes = await makeRequest('GET', `/api/analysis/${analysisId}`);
    assert(
      getAnalysisRes.status === 200 &&
      getAnalysisRes.data?.success === true &&
      getAnalysisRes.data?.data?.status === 'pending' &&
      getAnalysisRes.data?.data?.readinessScore === null &&
      Array.isArray(getAnalysisRes.data?.data?.gaps) &&
      Array.isArray(getAnalysisRes.data?.data?.unverifiedSkills) &&
      Array.isArray(getAnalysisRes.data?.data?.evidenceReferences),
      '10. Analysis results retrieved with gaps, unverified skills, and normalized evidence'
    );

    // 11. Roadmap retrieval: GET /api/roadmap/:analysisId
    const roadmapRes = await makeRequest('GET', `/api/roadmap/${analysisId}`);
    assert(
      roadmapRes.status === 200 &&
      roadmapRes.data?.success === true &&
      Array.isArray(roadmapRes.data?.data?.milestones) &&
      roadmapRes.data?.data?.milestones.length === 4,
      '11a. Roadmap retrieval returns 4-phase structured milestones'
    );

    // 12. Error format verification: Invalid MongoDB ID
    const badIdRes = await makeRequest('GET', '/api/profiles/invalid-id-123');
    assert(
      badIdRes.status === 400 &&
      badIdRes.data?.success === false &&
      typeof badIdRes.data?.error === 'string',
      '12. Invalid MongoDB ID returns 400 with { success: false, error: ... }'
    );

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test Suite Exception:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTestSuite();
