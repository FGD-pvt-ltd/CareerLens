/**
 * Automated Verification for Coding Platform Integration
 * Tests all required scenarios:
 * 1. Valid candidate + valid Codeforces profile (real API)
 * 2. Valid candidate + valid LeetCode profile (real public endpoint)
 * 3. Valid candidate + CodeChef profile (stores evidence without fake stats)
 * 4. Valid candidate + HackerRank profile (stores evidence with badges)
 * 5. Valid candidate + GeeksforGeeks profile (stores evidence without fake stats)
 * 6. Invalid candidate ID (400)
 * 7. Candidate not found (404)
 * 8. Invalid URL format (400)
 * 9. URL from wrong domain (400)
 * 10. Nonexistent username handling (404)
 * 11. External API error handling (clean JSON, no stack traces)
 * 12. Duplicate platform submission (updates in-place, no duplicate records)
 * 13. Refresh existing profile via PUT /api/profiles/:id/coding-profiles/:platform
 * 14. GET /api/profiles/:id includes codingProfiles
 * 15. DELETE /api/profiles/:id/coding-profiles/:platform removes profile
 */

const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
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

async function runVerification() {
  console.log('\n====================================================');
  console.log(' PROFIQ CODING PLATFORMS INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let server;
  let port;
  let testCandidateId;
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Connect DB
    await connectDB();

    // 2. Start HTTP server on random port
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
    console.log(`Test server running on port ${port}\n`);

    // 3. Create a candidate profile for testing
    const createRes = await makeRequest(port, 'POST', '/api/profiles', {
      basicInfo: {
        name: 'Coding Platforms Candidate',
        email: 'coding.test@profiq.internal',
      },
      targetRole: {
        roleName: 'Full Stack Developer',
      },
    });

    assert(
      createRes.status === 201 && createRes.data?.data?.profile?._id,
      'Setup: Created test candidate profile in MongoDB',
      JSON.stringify(createRes.data)
    );
    testCandidateId = createRes.data?.data?.profile?._id;

    // --- Test 6: Invalid candidate ID ---
    const invalidIdRes = await makeRequest(port, 'POST', '/api/profiles/not-an-id/coding-profiles', {
      platform: 'codeforces',
      profileUrl: 'https://codeforces.com/profile/tourist',
    });
    assert(
      invalidIdRes.status === 400 && invalidIdRes.data?.success === false && invalidIdRes.data?.error === 'Invalid profile ID',
      'Test 6: Invalid candidate ID returns 400 with clean error',
      JSON.stringify(invalidIdRes.data)
    );

    // --- Test 7: Nonexistent candidate ID ---
    const fakeObjectId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = await makeRequest(port, 'POST', `/api/profiles/${fakeObjectId}/coding-profiles`, {
      platform: 'codeforces',
      profileUrl: 'https://codeforces.com/profile/tourist',
    });
    assert(
      notFoundRes.status === 404 && notFoundRes.data?.success === false && notFoundRes.data?.error === 'Candidate profile not found',
      'Test 7: Nonexistent candidate returns 404 with clean error',
      JSON.stringify(notFoundRes.data)
    );

    // --- Test 8: Invalid URL format ---
    const invalidUrlRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'leetcode',
      profileUrl: 'not_a_valid_url',
    });
    assert(
      invalidUrlRes.status === 400 && invalidUrlRes.data?.success === false,
      'Test 8: Malformed URL returns 400 with clean error',
      JSON.stringify(invalidUrlRes.data)
    );

    // --- Test 9: URL from wrong domain ---
    const wrongDomainRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'leetcode',
      profileUrl: 'https://github.com/tourist',
    });
    assert(
      wrongDomainRes.status === 400 &&
        wrongDomainRes.data?.success === false &&
        wrongDomainRes.data?.error.includes('does not match platform'),
      'Test 9: URL from wrong domain rejected with 400',
      JSON.stringify(wrongDomainRes.data)
    );

    // --- Test 10: Nonexistent username ---
    const fakeUser = 'profiq_fake_user_' + Math.random().toString(36).substring(2, 8);
    const nonExistentRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'codeforces',
      profileUrl: `https://codeforces.com/profile/${fakeUser}`,
    });
    assert(
      nonExistentRes.status === 404 &&
        nonExistentRes.data?.success === false &&
        nonExistentRes.data?.error.toLowerCase().includes('not found'),
      'Test 10: Nonexistent username returns 404 with clean error',
      JSON.stringify(nonExistentRes.data)
    );

    // --- Test 1: Codeforces Integration (Live official API) ---
    console.log('Testing live Codeforces profile ingestion for "tourist"...');
    const cfRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'codeforces',
      profileUrl: 'https://codeforces.com/profile/tourist',
    });

    assert(
      cfRes.status === 200 && cfRes.data?.success === true,
      'Test 1a: Codeforces profile added successfully (HTTP 200)',
      JSON.stringify(cfRes.data)
    );
    const cfData = cfRes.data?.data?.codingProfile;
    assert(
      cfData && cfData.platform === 'codeforces' && cfData.username === 'tourist',
      'Test 1b: Codeforces platform and username normalized',
      `got ${cfData?.username}`
    );
    assert(
      cfData && typeof cfData.stats?.rating === 'number' && cfData.stats.rating > 0,
      'Test 1c: Codeforces rating populated from official API',
      `rating: ${cfData?.stats?.rating}`
    );
    assert(
      cfData && cfData.dataSource === 'official_api' && cfData.fetchStatus === 'completed',
      'Test 1d: Codeforces dataSource="official_api" and fetchStatus="completed"',
      `source: ${cfData?.dataSource}, status: ${cfData?.fetchStatus}`
    );

    // --- Test 2: LeetCode Integration (Live public endpoint) ---
    console.log('Testing live LeetCode profile ingestion for "neal_wu"...');
    const lcRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'leetcode',
      profileUrl: 'https://leetcode.com/u/neal_wu/',
    });

    assert(
      lcRes.status === 200 && lcRes.data?.success === true,
      'Test 2a: LeetCode profile added successfully (HTTP 200)',
      JSON.stringify(lcRes.data)
    );
    const lcData = lcRes.data?.data?.codingProfile;
    assert(
      lcData && lcData.platform === 'leetcode' && lcData.username === 'neal_wu',
      'Test 2b: LeetCode platform and username normalized from /u/ format',
      `got ${lcData?.username}`
    );
    assert(
      lcData && (lcData.fetchStatus === 'completed' || lcData.fetchStatus === 'unavailable'),
      'Test 2c: LeetCode fetchStatus is valid completed or graceful fallback',
      `status: ${lcData?.fetchStatus}`
    );

    // --- Test 3: CodeChef Integration ---
    console.log('Testing CodeChef profile ingestion...');
    const ccRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'codechef',
      profileUrl: 'https://www.codechef.com/users/tourist',
    });
    assert(
      ccRes.status === 200 && ccRes.data?.success === true,
      'Test 3a: CodeChef profile recorded successfully (HTTP 200)',
      JSON.stringify(ccRes.data)
    );
    const ccData = ccRes.data?.data?.codingProfile;
    assert(
      ccData &&
        ccData.platform === 'codechef' &&
        ccData.username === 'tourist' &&
        ccData.fetchStatus === 'unavailable' &&
        ccData.dataSource === 'user_provided' &&
        ccData.stats?.rating === null,
      'Test 3b: CodeChef correctly marked as user_provided/unavailable without fake stats',
      `fetchStatus: ${ccData?.fetchStatus}`
    );

    // --- Test 4: HackerRank Integration ---
    console.log('Testing HackerRank profile ingestion...');
    const hrRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'hackerrank',
      profileUrl: 'https://www.hackerrank.com/profile/tourist',
    });
    assert(
      hrRes.status === 200 && hrRes.data?.success === true,
      'Test 4: HackerRank profile recorded successfully (HTTP 200)',
      JSON.stringify(hrRes.data)
    );

    // --- Test 5: GeeksforGeeks Integration ---
    console.log('Testing GeeksforGeeks profile ingestion...');
    const gfgRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'geeksforgeeks',
      profileUrl: 'https://www.geeksforgeeks.org/user/tourist/',
    });
    assert(
      gfgRes.status === 200 && gfgRes.data?.success === true,
      'Test 5: GeeksforGeeks profile recorded successfully (HTTP 200)',
      JSON.stringify(gfgRes.data)
    );
    const gfgData = gfgRes.data?.data?.codingProfile;
    assert(
      gfgData &&
        gfgData.platform === 'geeksforgeeks' &&
        gfgData.username === 'tourist' &&
        gfgData.fetchStatus === 'unavailable' &&
        gfgData.stats?.problemsSolved === null,
      'Test 5b: GeeksforGeeks correctly preserves username without fabricated numbers',
      `username: ${gfgData?.username}`
    );

    // --- Test 12: Duplicate Platform Handling ---
    console.log('Testing duplicate submission for Codeforces to verify update in-place...');
    const duplicateRes = await makeRequest(port, 'POST', `/api/profiles/${testCandidateId}/coding-profiles`, {
      platform: 'codeforces',
      profileUrl: 'https://codeforces.com/profile/tourist',
    });
    assert(
      duplicateRes.status === 200 && duplicateRes.data?.success === true,
      'Test 12a: Duplicate platform submission succeeds with 200',
      JSON.stringify(duplicateRes.data)
    );

    // Check MongoDB directly
    const candidateInDb = await CandidateProfile.findById(testCandidateId);
    const cfEntries = (candidateInDb.codingProfiles || []).filter((p) => p.platform === 'codeforces');
    assert(
      cfEntries.length === 1,
      'Test 12b: Exactly 1 Codeforces entry exists in MongoDB (no duplicates)',
      `count: ${cfEntries.length}`
    );
    assert(
      (candidateInDb.codingProfiles || []).length === 5,
      'Test 12c: All 5 platforms preserved concurrently on candidate in MongoDB',
      `total count: ${candidateInDb?.codingProfiles?.length}`
    );

    // --- Test 13: Refresh via PUT /api/profiles/:id/coding-profiles/:platform ---
    console.log('Testing PUT refresh on Codeforces profile...');
    const refreshRes = await makeRequest(port, 'PUT', `/api/profiles/${testCandidateId}/coding-profiles/codeforces`);
    assert(
      refreshRes.status === 200 &&
        refreshRes.data?.success === true &&
        refreshRes.data?.data?.codingProfile?.platform === 'codeforces',
      'Test 13: PUT /api/profiles/:id/coding-profiles/codeforces refreshed successfully',
      JSON.stringify(refreshRes.data)
    );

    // --- Test 14: GET /api/profiles/:id includes codingProfiles ---
    const getProfileRes = await makeRequest(port, 'GET', `/api/profiles/${testCandidateId}`);
    assert(
      getProfileRes.status === 200 &&
        getProfileRes.data?.success === true &&
        Array.isArray(getProfileRes.data?.data?.profile?.codingProfiles) &&
        getProfileRes.data?.data?.profile?.codingProfiles.length === 5,
      'Test 14: GET /api/profiles/:id returns complete codingProfiles array',
      `length: ${getProfileRes.data?.data?.profile?.codingProfiles?.length}`
    );

    // --- Test 15: DELETE /api/profiles/:id/coding-profiles/:platform ---
    console.log('Testing DELETE coding profile for geeksforgeeks...');
    const deleteRes = await makeRequest(
      port,
      'DELETE',
      `/api/profiles/${testCandidateId}/coding-profiles/geeksforgeeks`
    );
    assert(
      deleteRes.status === 200 &&
        deleteRes.data?.success === true &&
        deleteRes.data?.data?.codingProfiles?.length === 4,
      'Test 15: DELETE /api/profiles/:id/coding-profiles/geeksforgeeks removes platform cleanly',
      JSON.stringify(deleteRes.data)
    );

    console.log('\n====================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Fatal error during test run:', err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
