/**
 * Automated Verification Suite for ProfiQ Job Role & Requirement Layer
 * 
 * Tests all 12 specifications from current task:
 * 1. Seed all 10 benchmark roles
 * 2. Verify idempotency (no duplicates on running seed twice)
 * 3. GET /api/roles returns full catalog
 * 4. GET /api/roles/:id returns structured role details
 * 5. GET /api/roles/slug/backend-developer returns specific role by slug
 * 6. Select valid target role for candidate (PUT /api/profiles/:id/target-role)
 * 7. Select invalid target role returns clean error (404 / 400)
 * 8. Change target role to another valid role
 * 9. Verify unified profile contains { roleId, roleName, slug }
 * 10. Verify MongoDB collection jobroles contains all 10 documents
 * 11. Verify existing profile APIs remain backward compatible
 * 12. Verify role-skill normalization and taxonomy
 */

const http = require('http');
const assert = require('assert');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const JobRole = require('./src/models/JobRole');
const CandidateProfile = require('./src/models/CandidateProfile');
const { seedRoles, SEED_JOB_ROLES } = require('./src/scripts/seedRoles');
const { normalizeSkill, normalizeSkillList } = require('./src/utils/skillNormalizer');

const TEST_PORT = 61420;
let testServer = null;

function makeRequest(method, pathUrl, body = null, headers = {}) {
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
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTestSuite() {
  console.log('\n====================================================');
  console.log(' PROFIQ JOB ROLE & REQUIREMENT SYSTEM TEST SUITE');
  console.log('====================================================\n');

  try {
    // 0. Initialize DB and Server
    await connectDB();
    await new Promise((resolve) => {
      testServer = app.listen(TEST_PORT, () => {
        console.log(`[Test Server] Express running on port ${TEST_PORT}\n`);
        resolve();
      });
    });

    // --- Test 1: Seed all roles ---
    console.log('--- Test 1: Seed All 10 Benchmark Roles ---');
    const firstSeed = await seedRoles();
    assert(firstSeed.total === 10, 'Test 1a: seedRoles returned 10 roles');
    const countAfterFirst = await JobRole.countDocuments();
    assert(countAfterFirst === 10, 'Test 1b: Exactly 10 JobRole documents in MongoDB');
    console.log('[PASS] Test 1: Seeded 10 benchmark roles into MongoDB');

    // --- Test 2: Idempotency (run seed twice, no duplicates) ---
    console.log('\n--- Test 2: Seed Idempotency ---');
    const secondSeed = await seedRoles();
    assert(secondSeed.total === 10, 'Test 2a: second seed returned 10 roles');
    const countAfterSecond = await JobRole.countDocuments();
    assert(countAfterSecond === 10, 'Test 2b: Count in MongoDB remains exactly 10 with zero duplicates');
    console.log('[PASS] Test 2: Idempotency verified — no duplicate documents created on re-seed');

    // --- Test 3: GET /api/roles ---
    console.log('\n--- Test 3: GET /api/roles ---');
    const rolesRes = await makeRequest('GET', '/api/roles');
    assert(rolesRes.status === 200, 'Test 3a: GET /api/roles returns 200');
    assert(rolesRes.data?.success === true, 'Test 3b: success is true');
    assert(Array.isArray(rolesRes.data?.data?.roles), 'Test 3c: roles is array');
    assert(rolesRes.data?.data?.roles?.length === 10, 'Test 3d: all 10 roles returned');
    console.log('[PASS] Test 3: GET /api/roles returned full catalog of 10 roles');

    // --- Test 4: GET /api/roles/:id ---
    console.log('\n--- Test 4: GET /api/roles/:id ---');
    const firstRole = rolesRes.data.data.roles[0];
    const singleRoleRes = await makeRequest('GET', `/api/roles/${firstRole.id}`);
    assert(singleRoleRes.status === 200, 'Test 4a: GET /api/roles/:id returns 200');
    const roleDoc = singleRoleRes.data?.data?.role;
    assert(roleDoc.name === firstRole.name, 'Test 4b: Correct role returned');
    assert(Array.isArray(roleDoc.requiredSkills), 'Test 4c: requiredSkills is array');
    assert(Array.isArray(roleDoc.preferredSkills), 'Test 4d: preferredSkills is array');
    assert(roleDoc.requiredSkills.length > 0, 'Test 4e: requiredSkills not empty');
    assert(Boolean(roleDoc.requiredSkills[0].importance), 'Test 4f: importance field present');
    assert(Boolean(roleDoc.requiredSkills[0].expectedLevel), 'Test 4g: expectedLevel field present');
    console.log(`[PASS] Test 4: GET /api/roles/:id returned structured requirements for ${roleDoc.name}`);

    // --- Test 5: GET /api/roles/slug/:slug ---
    console.log('\n--- Test 5: GET /api/roles/slug/backend-developer ---');
    const slugRes = await makeRequest('GET', '/api/roles/slug/backend-developer');
    assert(slugRes.status === 200, 'Test 5a: GET /api/roles/slug returns 200');
    const backendRole = slugRes.data?.data?.role;
    assert(backendRole.slug === 'backend-developer', 'Test 5b: slug is backend-developer');
    assert(backendRole.name === 'Backend Developer', 'Test 5c: name is Backend Developer');
    assert(backendRole.commonTechnologies.includes('Node.js'), 'Test 5d: commonTechnologies includes Node.js');
    console.log('[PASS] Test 5: GET /api/roles/slug/backend-developer returned Backend Developer');

    // Nonexistent slug returns 404
    const badSlugRes = await makeRequest('GET', '/api/roles/slug/nonexistent-engineer');
    assert(badSlugRes.status === 404, 'Test 5e: Nonexistent slug returns 404');
    console.log('[PASS] Test 5e: Nonexistent slug rejected with 404');

    // --- Test 6: Candidate Selects Valid Target Role ---
    console.log('\n--- Test 6: Candidate Selects Valid Target Role ---');
    const candidate = new CandidateProfile({
      basicInfo: { name: 'Alex Johnson', email: 'alex@example.com' },
      skills: [{ name: 'JavaScript' }, { name: 'Node.js' }],
    });
    await candidate.save();
    const candidateId = candidate._id.toString();

    const selectRoleRes = await makeRequest('PUT', `/api/profiles/${candidateId}/target-role`, {
      roleId: backendRole.id,
      roleName: backendRole.name,
      slug: backendRole.slug,
    });
    assert(selectRoleRes.status === 200, 'Test 6a: Select target role returns 200');
    assert(selectRoleRes.data?.data?.targetRole?.slug === 'backend-developer', 'Test 6b: targetRole.slug stored');
    assert(selectRoleRes.data?.data?.targetRole?.roleName === 'Backend Developer', 'Test 6c: targetRole.roleName stored');
    console.log('[PASS] Test 6: Valid target role assigned to candidate profile');

    // --- Test 7: Candidate Selects Invalid Target Role ---
    console.log('\n--- Test 7: Reject Invalid Target Role ---');
    const badRoleRes = await makeRequest('PUT', `/api/profiles/${candidateId}/target-role`, {
      roleId: '507f1f77bcf86cd799439011', // valid ObjectId format but does not exist in DB
    });
    assert(badRoleRes.status === 404, 'Test 7a: Invalid target role returns 404');
    assert(badRoleRes.data?.error === 'Target role not found', 'Test 7b: Clean error message returned');
    console.log('[PASS] Test 7: Invalid target role rejected with 404 "Target role not found"');

    // Also test via PUT /api/profiles/:id
    const badPutRes = await makeRequest('PUT', `/api/profiles/${candidateId}`, {
      targetRole: {
        roleId: '507f1f77bcf86cd799439011',
      },
    });
    assert(badPutRes.status === 404, 'Test 7c: PUT /api/profiles/:id rejects invalid role with 404');
    console.log('[PASS] Test 7c: General profile update rejects invalid target role with 404');

    // --- Test 8: Change Target Role ---
    console.log('\n--- Test 8: Change Target Role ---');
    const frontendSlugRes = await makeRequest('GET', '/api/roles/slug/frontend-developer');
    const frontendRole = frontendSlugRes.data.data.role;

    const changeRoleRes = await makeRequest('PUT', `/api/profiles/${candidateId}/target-role`, {
      roleId: frontendRole.id,
    });
    assert(changeRoleRes.status === 200, 'Test 8a: Change target role returns 200');
    assert(changeRoleRes.data?.data?.targetRole?.slug === 'frontend-developer', 'Test 8b: New slug updated');
    assert(changeRoleRes.data?.data?.targetRole?.roleName === 'Frontend Developer', 'Test 8c: New roleName updated');
    console.log('[PASS] Test 8: Candidate target role changed to Frontend Developer');

    // --- Test 9: Verify Unified Profile Contains Target Role ---
    console.log('\n--- Test 9: Unified Profile Target Role Verification ---');
    const unifiedRes = await makeRequest('GET', `/api/profiles/${candidateId}/unified`);
    assert(unifiedRes.status === 200, 'Test 9a: GET /api/profiles/:id/unified returns 200');
    const unifiedTargetRole = unifiedRes.data?.data?.candidate?.targetRole;
    assert(unifiedTargetRole.roleName === 'Frontend Developer', 'Test 9b: unified.candidate.targetRole.roleName is Frontend Developer');
    assert(unifiedTargetRole.slug === 'frontend-developer', 'Test 9c: unified.candidate.targetRole.slug is frontend-developer');
    assert(Boolean(unifiedTargetRole.roleId), 'Test 9d: unified.candidate.targetRole.roleId is populated');
    console.log('[PASS] Test 9: Unified profile correctly surfaces normalized targetRole reference');

    // --- Test 10: Verify MongoDB jobroles collection ---
    console.log('\n--- Test 10: MongoDB Collection Verification ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasJobRolesCollection = collections.some((c) => c.name === 'jobroles');
    assert(hasJobRolesCollection, 'Test 10a: "jobroles" collection exists in MongoDB');
    const allDbRoles = await JobRole.find();
    assert(allDbRoles.length === 10, 'Test 10b: Exactly 10 JobRole documents in DB');
    console.log('[PASS] Test 10: Verified "jobroles" collection with 10 documents in MongoDB');

    // --- Test 11: Skill Taxonomy and Normalization ---
    console.log('\n--- Test 11: Skill Taxonomy & Deterministic Normalization ---');
    const n1 = normalizeSkill('JS');
    assert(n1.canonicalName === 'JavaScript' && n1.category === 'programming', 'Test 11a: JS -> JavaScript');

    const n2 = normalizeSkill('NodeJS');
    assert(n2.canonicalName === 'Node.js' && n2.category === 'backend', 'Test 11b: NodeJS -> Node.js');

    const n3 = normalizeSkill('Mongo DB');
    assert(n3.canonicalName === 'MongoDB' && n3.category === 'database', 'Test 11c: Mongo DB -> MongoDB');

    const n4 = normalizeSkill('K8s');
    assert(n4.canonicalName === 'Kubernetes' && n4.category === 'devops', 'Test 11d: K8s -> Kubernetes');

    const listNormalized = normalizeSkillList(['js', 'JavaScript', 'NodeJS', 'node.js', 'react']);
    assert(listNormalized.length === 3, 'Test 11e: Deduped list has 3 canonical items');
    assert(listNormalized.includes('JavaScript') && listNormalized.includes('Node.js') && listNormalized.includes('React'), 'Test 11f: All canonical names present');
    console.log('[PASS] Test 11: Deterministic skill taxonomy and aliases verified');

    // --- Test 12: Existing Profile API Backward Compatibility ---
    console.log('\n--- Test 12: Existing Profile API Backward Compatibility ---');
    const getProfileRes = await makeRequest('GET', `/api/profiles/${candidateId}`);
    assert(getProfileRes.status === 200, 'Test 12a: GET /api/profiles/:id returns 200');
    assert(getProfileRes.data?.data?.profile?.targetRole?.roleName === 'Frontend Developer', 'Test 12b: targetRole preserved in standard profile retrieval');
    console.log('[PASS] Test 12: Backward compatibility confirmed across existing profile endpoints');

    console.log('\n====================================================');
    console.log(' RESULTS: ALL 12 TEST SUITES PASSED (0 FAILURES)');
    console.log('====================================================\n');

  } finally {
    if (testServer) {
      await new Promise((resolve) => testServer.close(resolve));
    }
    await disconnectDB();
  }
}

runTestSuite().catch((err) => {
  console.error('[TEST SUITE ERROR]', err);
  process.exit(1);
});
