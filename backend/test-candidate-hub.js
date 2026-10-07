/**
 * Automated Verification for Candidate Data Hub Task
 */

const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const CandidateProfile = require('./src/models/CandidateProfile');

function makeRequest(port, method, pathUrl, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: 'localhost',
      port,
      path: pathUrl,
      method,
      headers,
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

async function runCandidateHubTests() {
  console.log('====================================================');
  console.log(' PROFIQ CANDIDATE DATA HUB VERIFICATION TEST');
  console.log('====================================================\n');

  const TEST_PORT = 5056;
  let server;
  let passed = 0;
  let failed = 0;

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
    // Attempt MongoDB connection if MONGODB_URI is provided
    try {
      if (process.env.MONGODB_URI) {
        await connectDB();
      }
    } catch (dbErr) {
      console.log(`[Notice] MongoDB live connection not reachable: ${dbErr.message}`);
    }

    server = await new Promise((resolve) => {
      const s = app.listen(TEST_PORT, () => resolve(s));
    });

    // 1. GET /api/health
    const healthRes = await makeRequest(TEST_PORT, 'GET', '/api/health');
    assert(
      healthRes.status === 200 &&
      healthRes.data?.success === true &&
      healthRes.data?.message === 'ProfiQ backend is running',
      '1. GET /api/health returns exact expected message',
      JSON.stringify(healthRes.data)
    );

    // 2. POST /api/profiles - Valid Profile Creation
    const validCandidatePayload = {
      basicInfo: {
        name: 'Test Candidate',
        email: 'test@example.com',
        location: 'Chennai',
        headline: 'Computer Science Student',
      },
      college: {
        name: 'Example University',
        degree: 'B.Tech',
        branch: 'Computer Science Engineering',
        graduationYear: 2028,
        cgpa: 8.9,
      },
      skills: [
        {
          name: 'C',
          category: 'Programming',
          source: 'resume',
        },
        {
          name: 'DSA',
          category: 'Computer Science',
          source: 'resume',
        },
      ],
      projects: [
        {
          name: 'Example Project',
          description: 'Example project description',
          technologies: ['C', 'MongoDB'],
          githubUrl: 'https://github.com/example/project',
        },
      ],
      codingProfiles: [
        {
          platform: 'LeetCode',
          username: 'example',
          profileUrl: 'https://leetcode.com/example',
        },
      ],
      github: {
        username: 'example',
        profileUrl: 'https://github.com/example',
      },
      targetRole: {
        roleName: 'Backend Developer',
      },
    };

    let createdId = null;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      const createRes = await makeRequest(TEST_PORT, 'POST', '/api/profiles', validCandidatePayload);
      assert(
        createRes.status === 201 &&
        createRes.data?.success === true &&
        createRes.data?.message === 'Candidate profile created successfully' &&
        createRes.data?.data?.profile?._id,
        '2. POST /api/profiles creates candidate profile document',
        JSON.stringify(createRes.data)
      );

      createdId = createRes.data?.data?.profile?._id;

      // 3. GET /api/profiles/:id
      const getRes = await makeRequest(TEST_PORT, 'GET', `/api/profiles/${createdId}`);
      assert(
        getRes.status === 200 &&
        getRes.data?.success === true &&
        getRes.data?.data?.profile?.basicInfo?.name === 'Test Candidate' &&
        getRes.data?.data?.profile?.college?.graduationYear === 2028,
        '3. GET /api/profiles/:id retrieves complete candidate profile JSON',
        JSON.stringify(getRes.data)
      );
    } else {
      console.log('[SKIP] Tests 2 & 3 skipped because MongoDB is not connected yet (connect MONGODB_URI in .env to execute).');
    }

    // 4. Invalid profile ID format
    const badIdRes = await makeRequest(TEST_PORT, 'GET', '/api/profiles/invalid-id-xyz');
    assert(
      badIdRes.status === 400 &&
      badIdRes.data?.success === false &&
      badIdRes.data?.error === 'Invalid profile ID',
      '4. Invalid profile ID returns 400 and { success: false, error: "Invalid profile ID" }',
      JSON.stringify(badIdRes.data)
    );

    // 5. Nonexistent profile ID
    const dummyId = '000000000000000000000000';
    if (mongoose.connection.readyState === 1) {
      const notFoundRes = await makeRequest(TEST_PORT, 'GET', `/api/profiles/${dummyId}`);
      assert(
        notFoundRes.status === 404 &&
        notFoundRes.data?.success === false &&
        notFoundRes.data?.error === 'Candidate profile not found',
        '5. Nonexistent profile ID returns 404 and { success: false, error: "Candidate profile not found" }',
        JSON.stringify(notFoundRes.data)
      );
    }

    // 6. Invalid email validation
    if (mongoose.connection.readyState === 1) {
      const invalidEmailRes = await makeRequest(TEST_PORT, 'POST', '/api/profiles', {
        basicInfo: {
          name: 'Invalid Email Candidate',
          email: 'not-an-email-address',
        },
      });
      assert(
        invalidEmailRes.status === 400 &&
        invalidEmailRes.data?.success === false,
        '6. Invalid email format rejected with 400',
        JSON.stringify(invalidEmailRes.data)
      );

      // 7. Invalid URL validation
      const invalidUrlRes = await makeRequest(TEST_PORT, 'POST', '/api/profiles', {
        basicInfo: {
          name: 'Invalid URL Candidate',
        },
        github: {
          profileUrl: 'htp://broken-url',
        },
      });
      assert(
        invalidUrlRes.status === 400 &&
        invalidUrlRes.data?.success === false,
        '7. Invalid URL format rejected with 400',
        JSON.stringify(invalidUrlRes.data)
      );
    }

    // 8. Missing/empty request body
    const emptyBodyRes = await makeRequest(TEST_PORT, 'POST', '/api/profiles', {});
    assert(
      emptyBodyRes.status === 400 &&
      emptyBodyRes.data?.success === false,
      '8a. Empty request body rejected with 400',
      JSON.stringify(emptyBodyRes.data)
    );

    // Missing basicInfo.name
    const missingNameRes = await makeRequest(TEST_PORT, 'POST', '/api/profiles', {
      basicInfo: {},
    });
    assert(
      missingNameRes.status === 400 &&
      missingNameRes.data?.success === false,
      '8b. Missing basicInfo.name rejected with 400',
      JSON.stringify(missingNameRes.data)
    );

    // 9. Schema Unit Validations (Independent of Live DB Connection)
    console.log('\n--- CandidateProfile Schema Validation Unit Tests ---');

    // 9a. Valid Document Validation
    const validModelDoc = new CandidateProfile(validCandidatePayload);
    const validModelErr = validModelDoc.validateSync();
    assert(validModelErr === undefined, '9a. Full candidate profile validates with 0 errors');

    // 9b. Partial Profile Validation (Resume + GitHub + targetRole only)
    const partialDoc = new CandidateProfile({
      basicInfo: { name: 'Partial Candidate' },
      resume: { fileName: 'resume.pdf' },
      github: { username: 'dev' },
      targetRole: { roleName: 'Frontend Engineer' },
    });
    const partialErr = partialDoc.validateSync();
    assert(partialErr === undefined, '9b. Partial candidate profile (without LinkedIn, portfolio, certs) is valid');

    // 9c. Invalid Email Validation
    const badEmailDoc = new CandidateProfile({
      basicInfo: { name: 'Test', email: 'invalid-email-address' },
    });
    const badEmailErr = badEmailDoc.validateSync();
    assert(
      badEmailErr && badEmailErr.errors['basicInfo.email'],
      '9c. Invalid email format correctly rejected by schema'
    );

    // 9d. Invalid URL Validation
    const badUrlDoc = new CandidateProfile({
      basicInfo: { name: 'Test' },
      github: { profileUrl: 'not-a-valid-url' },
    });
    const badUrlErr = badUrlDoc.validateSync();
    assert(
      badUrlErr && badUrlErr.errors['github.profileUrl'],
      '9d. Malformed URL correctly rejected by schema'
    );

    // 9e. CGPA Range Validation (> 10)
    const badCgpaDoc = new CandidateProfile({
      basicInfo: { name: 'Test' },
      college: { cgpa: 11.5 },
    });
    const badCgpaErr = badCgpaDoc.validateSync();
    assert(
      badCgpaErr && badCgpaErr.errors['college.cgpa'],
      '9e. CGPA exceeding 10 correctly rejected by schema'
    );

    // 9f. Percentage Range Validation (> 100)
    const badPctDoc = new CandidateProfile({
      basicInfo: { name: 'Test' },
      college: { percentage: 105 },
    });
    const badPctErr = badPctDoc.validateSync();
    assert(
      badPctErr && badPctErr.errors['college.percentage'],
      '9f. Percentage exceeding 100 correctly rejected by schema'
    );

    // 9g. Graduation Year Validation
    const badGradDoc = new CandidateProfile({
      basicInfo: { name: 'Test' },
      college: { graduationYear: 1800 },
    });
    const badGradErr = badGradDoc.validateSync();
    assert(
      badGradErr && badGradDoc.errors['college.graduationYear'],
      '9g. graduationYear outside sensible range correctly rejected by schema'
    );

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
  } finally {
    if (server) {
      await new Promise((res) => server.close(res));
    }
    const { disconnectDB } = require('./src/config/db');
    await disconnectDB();
    if (require.main === module) {
      process.exit(failed > 0 ? 1 : 0);
    }
  }
}

if (require.main === module) {
  runCandidateHubTests();
}

module.exports = { runCandidateHubTests };
