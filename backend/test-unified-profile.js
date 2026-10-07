/**
 * Automated Verification Suite for Unified Candidate Profile & Enrichment
 * 
 * Tests all 18 milestone requirements:
 * 1. Update basic information
 * 2. Add college details
 * 3. Add education
 * 4. Add experience
 * 5. Add multiple projects
 * 6. Add certifications (including file reference)
 * 7. Add academic achievements
 * 8. Add other achievements
 * 9. Add LinkedIn / professional profile
 * 10. Add portfolio
 * 11. Set target role
 * 12. Retrieve unified profile (GET /api/profiles/:id/unified)
 * 13. Check profileCompleteness calculation
 * 14. Test duplicate external profiles (updates in-place)
 * 15. Test invalid URLs rejection
 * 16. Test invalid IDs (400 and 404)
 * 17. Test partial profile handling
 * 18. Verify existing resume / GitHub / coding-profile data is preserved
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
const { calculateProfileCompleteness } = require('./src/utils/completenessCalculator');
const profileAggregationService = require('./src/services/profileAggregationService');

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

async function runUnifiedProfileTests() {
  console.log('\n====================================================');
  console.log(' PROFIQ UNIFIED CANDIDATE PROFILE TEST SUITE');
  console.log('====================================================\n');

  const TEST_PORT = 61380;
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
    await connectDB();

    server = await new Promise((resolve) => {
      const s = app.listen(TEST_PORT, () => resolve(s));
    });

    // Setup: Create base test candidate
    const createRes = await makeRequest(TEST_PORT, 'POST', '/api/profiles', {
      basicInfo: {
        name: 'Asati Unified Tester',
        email: `asati_unified_${Date.now()}@example.com`,
      },
    });

    assert(createRes.status === 201, 'Setup: Created candidate profile in MongoDB');
    const profileId = createRes.data?.data?.profile?._id;
    assert(Boolean(profileId), 'Setup: Retrieved candidate ID', profileId);

    // 1. Update basic information
    console.log('\n--- Test 1: Update Basic Information ---');
    const updateBasicRes = await makeRequest(TEST_PORT, 'PUT', `/api/profiles/${profileId}`, {
      basicInfo: {
        headline: 'Lead Cloud Architect & Systems Specialist',
        phone: '+1-555-0199',
        location: 'San Francisco, CA',
        profilePhotoUrl: 'https://example.com/avatar.jpg',
      },
    });
    assert(
      updateBasicRes.status === 200 &&
      updateBasicRes.data?.data?.profile?.basicInfo?.headline === 'Lead Cloud Architect & Systems Specialist' &&
      updateBasicRes.data?.data?.profile?.basicInfo?.profilePhotoUrl === 'https://example.com/avatar.jpg',
      'Test 1: Updated basic information successfully'
    );

    // 2. Add college details
    console.log('\n--- Test 2: Add College Details ---');
    const collegeRes = await makeRequest(TEST_PORT, 'PUT', `/api/profiles/${profileId}`, {
      college: {
        collegeName: 'Stanford Institute of Technology',
        degree: 'Bachelor of Science',
        branch: 'Computer Science',
        specialization: 'Distributed Systems',
        yearOfStudy: 'Final Year',
        graduationYear: 2025,
        cgpa: 9.4,
        relevantCoursework: ['Operating Systems', 'Algorithms', 'Distributed Databases'],
      },
    });
    assert(
      collegeRes.status === 200 &&
      collegeRes.data?.data?.profile?.college?.collegeName === 'Stanford Institute of Technology' &&
      collegeRes.data?.data?.profile?.college?.specialization === 'Distributed Systems' &&
      collegeRes.data?.data?.profile?.college?.graduationYear === 2025,
      'Test 2: Added college details with graduationYear and specialization'
    );

    // 3. Add education history
    console.log('\n--- Test 3: Add Education ---');
    const eduRes = await makeRequest(TEST_PORT, 'PUT', `/api/profiles/${profileId}`, {
      education: [
        {
          level: 'high_school',
          institution: 'City Central High School',
          degree: 'High School Diploma',
          field: 'Science & Math',
          startYear: 2017,
          endYear: 2021,
          percentage: 95.5,
        },
      ],
    });
    assert(
      eduRes.status === 200 &&
      eduRes.data?.data?.profile?.education?.length === 1 &&
      eduRes.data?.data?.profile?.education[0]?.level === 'high_school',
      'Test 3: Added previous education entry'
    );

    // 4. Add experience / internships
    console.log('\n--- Test 4: Add Experience ---');
    const expRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/experience`, {
      organization: 'TechFlow Systems',
      role: 'Backend Engineering Intern',
      employmentType: 'internship',
      location: 'Remote',
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-08-31'),
      isCurrent: false,
      description: 'Engineered high-throughput event queues processing 10k req/sec.',
      technologies: ['Node.js', 'Redis', 'Kafka'],
      source: 'user_input',
    });
    assert(
      expRes.status === 201 &&
      expRes.data?.data?.experience?.length === 1 &&
      expRes.data?.data?.experience[0]?.employmentType === 'internship',
      'Test 4: Added internship experience with employmentType and technologies'
    );

    // 5. Add multiple projects
    console.log('\n--- Test 5: Add Multiple Projects ---');
    const proj1Res = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/projects`, {
      name: 'Distributed Cache Cluster',
      description: 'In-memory key-value store with consistent hashing.',
      technologies: ['Go', 'Raft', 'gRPC'],
      category: 'Systems',
      githubUrl: 'https://github.com/example/cache-cluster',
      liveUrl: 'https://cache.example.com',
      teamSize: 2,
    });
    const proj2Res = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/projects`, {
      name: 'ProfiQ Career Analyzer',
      description: 'Career intelligence telemetry engine.',
      technologies: ['Node.js', 'Express', 'MongoDB'],
      category: 'Full Stack',
      githubUrl: 'https://github.com/example/profiq',
      teamSize: 3,
    });
    assert(
      proj1Res.status === 201 &&
      proj2Res.status === 201 &&
      proj2Res.data?.data?.projects?.length === 2,
      'Test 5: Added multiple projects successfully'
    );

    // 6. Add certifications
    console.log('\n--- Test 6: Add Certifications ---');
    const certRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/certifications`, {
      name: 'AWS Certified Solutions Architect - Associate',
      issuingOrganization: 'Amazon Web Services',
      credentialId: 'AWS-99882233',
      credentialUrl: 'https://aws.amazon.com/verify/AWS-99882233',
      issueDate: '2024-01-15',
    });
    assert(
      certRes.status === 201 &&
      certRes.data?.data?.certifications?.length === 1 &&
      certRes.data?.data?.certifications[0]?.issuingOrganization === 'Amazon Web Services',
      'Test 6: Added certification with credentialUrl and issuingOrganization'
    );

    // 7. Add academic achievements
    console.log('\n--- Test 7: Add Academic Achievements ---');
    const acadRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/academic-achievements`, {
      title: 'Dean’s Honor List (Fall 2023)',
      organization: 'Stanford Institute of Technology',
      description: 'Awarded for maintaining top 1% academic standing.',
    });
    assert(
      acadRes.status === 201 &&
      acadRes.data?.data?.academicAchievements?.length === 1,
      'Test 7: Added academic achievement'
    );

    // 8. Add other achievements
    console.log('\n--- Test 8: Add Extracurricular Achievements ---');
    const achRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/achievements`, {
      title: 'Global Hackathon 2024 - 1st Place',
      category: 'hackathon',
      organization: 'Major League Hacking',
      description: 'Built decentralized identity verification platform.',
    });
    assert(
      achRes.status === 201 &&
      achRes.data?.data?.achievements?.length === 1 &&
      achRes.data?.data?.achievements[0]?.category === 'hackathon',
      'Test 8: Added hackathon achievement'
    );

    // 9. Add LinkedIn / professional profile
    console.log('\n--- Test 9: Add Professional Profile ---');
    const profRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/professional-profiles`, {
      platform: 'LinkedIn',
      profileUrl: 'https://linkedin.com/in/asati-engineer',
      displayName: 'Asati Professional',
    });
    assert(
      profRes.status === 200 &&
      profRes.data?.data?.professionalProfiles?.length === 1 &&
      profRes.data?.data?.professionalProfiles[0]?.fetchStatus === 'user_provided',
      'Test 9: Added LinkedIn profile with user_provided status without scraping'
    );

    // 10. Add portfolio
    console.log('\n--- Test 10: Add Portfolio ---');
    const portRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/portfolios`, {
      platform: 'Personal Website',
      url: 'https://asati.dev',
      title: 'Personal Engineering Portfolio',
      description: 'Architectural case studies and technical articles',
    });
    assert(
      portRes.status === 200 &&
      portRes.data?.data?.portfolios?.length === 1 &&
      portRes.data?.data?.portfolios[0]?.url === 'https://asati.dev',
      'Test 10: Added portfolio entry'
    );

    // 11. Set target role
    console.log('\n--- Test 11: Set Target Role ---');
    const roleRes = await makeRequest(TEST_PORT, 'PUT', `/api/profiles/${profileId}/target-role`, {
      roleId: 'backend_engineer',
      roleName: 'Backend Engineer',
    });
    assert(
      roleRes.status === 200 &&
      roleRes.data?.data?.targetRole?.roleName === 'Backend Engineer',
      'Test 11: Stored target role without applying AI scoring'
    );

    // 12. Retrieve Unified Profile (GET /api/profiles/:id/unified)
    console.log('\n--- Test 12: Retrieve Unified Profile ---');
    const unifiedRes = await makeRequest(TEST_PORT, 'GET', `/api/profiles/${profileId}/unified`);
    assert(unifiedRes.status === 200, 'Test 12a: GET /api/profiles/:id/unified returned 200');
    const candidateObj = unifiedRes.data?.data?.candidate;
    assert(Boolean(candidateObj), 'Test 12b: candidate object present in response');
    assert(Boolean(candidateObj?.basicInfo?.name), 'Test 12c: basicInfo populated');
    assert(Boolean(candidateObj?.college?.collegeName), 'Test 12d: college populated');
    assert(candidateObj?.experience?.length === 1, 'Test 12e: experience populated');
    assert(candidateObj?.projects?.length === 2, 'Test 12f: projects populated');
    assert(candidateObj?.certifications?.length === 1, 'Test 12g: certifications populated');
    assert(candidateObj?.professionalProfiles?.length === 1, 'Test 12h: professionalProfiles populated');
    assert(candidateObj?.portfolios?.length === 1, 'Test 12i: portfolios populated');
    assert(candidateObj?.achievements?.length === 1, 'Test 12j: achievements populated');
    assert(candidateObj?.targetRole?.roleName === 'Backend Engineer', 'Test 12k: targetRole populated');

    // Section 23: Verify AI handoff structure for Aman
    const aiHandoff = unifiedRes.data?.data?.aiHandoff;
    assert(Boolean(aiHandoff?.candidateId), 'Test 12l: aiHandoff has candidateId');
    assert(aiHandoff?.targetRole === 'Backend Engineer', 'Test 12m: aiHandoff has targetRole');
    assert(Boolean(aiHandoff?.profile?.basicInfo), 'Test 12n: aiHandoff has clean profile data');

    // 13. Check Profile Completeness
    console.log('\n--- Test 13: Check Profile Completeness ---');
    const completeness = unifiedRes.data?.data?.profileCompleteness;
    console.log(`Profile completeness score: ${completeness}%`);
    assert(typeof completeness === 'number' && completeness > 0, 'Test 13a: profileCompleteness is positive number');
    const breakdown = unifiedRes.data?.data?.completenessBreakdown;
    assert(
      breakdown?.basicInfo === true &&
      breakdown?.education === true &&
      breakdown?.projects === true &&
      breakdown?.experience === true &&
      breakdown?.certifications === true &&
      breakdown?.targetRole === true,
      'Test 13b: Deterministic completeness breakdown verified'
    );

    // 14. Test duplicate external profiles (updates in-place)
    console.log('\n--- Test 14: Duplicate Handling ---');
    const dupProfRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/professional-profiles`, {
      platform: 'LinkedIn',
      profileUrl: 'https://linkedin.com/in/asati-engineer-updated',
    });
    assert(
      dupProfRes.status === 200 &&
      dupProfRes.data?.data?.professionalProfiles?.length === 1 &&
      dupProfRes.data?.data?.professionalProfiles[0]?.profileUrl === 'https://linkedin.com/in/asati-engineer-updated',
      'Test 14a: Duplicate LinkedIn profile updated in-place without duplicating'
    );

    const dupPortRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/portfolios`, {
      platform: 'Personal Website',
      url: 'https://asati.dev',
      title: 'Updated Portfolio Title',
    });
    assert(
      dupPortRes.status === 200 &&
      dupPortRes.data?.data?.portfolios?.length === 1 &&
      dupPortRes.data?.data?.portfolios[0]?.title === 'Updated Portfolio Title',
      'Test 14b: Duplicate portfolio URL updated in-place without duplicating'
    );

    // 15. Test invalid URLs
    console.log('\n--- Test 15: Invalid URL Validation ---');
    const badUrlRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/projects`, {
      name: 'Broken URL Project',
      githubUrl: 'not_a_valid_url',
    });
    assert(
      badUrlRes.status === 400 && badUrlRes.data?.success === false,
      'Test 15a: Malformed project githubUrl rejected with 400'
    );

    const badPortRes = await makeRequest(TEST_PORT, 'POST', `/api/profiles/${profileId}/portfolios`, {
      url: 'ftp://not-supported-scheme',
    });
    assert(
      badPortRes.status === 400 && badPortRes.data?.success === false,
      'Test 15b: Unsupported URL scheme in portfolio rejected with 400'
    );

    // 16. Test invalid IDs
    console.log('\n--- Test 16: Invalid ID Handling ---');
    const invalidIdRes = await makeRequest(TEST_PORT, 'GET', '/api/profiles/invalid-id-123/unified');
    assert(
      invalidIdRes.status === 400 && invalidIdRes.data?.error === 'Invalid profile ID',
      'Test 16a: Invalid MongoDB ObjectId returns 400'
    );

    const notFoundRes = await makeRequest(TEST_PORT, 'GET', '/api/profiles/650000000000000000000000/unified');
    assert(
      notFoundRes.status === 404 && notFoundRes.data?.error === 'Candidate profile not found',
      'Test 16b: Non-existent candidate profile returns 404'
    );

    // 17. Test partial profile handling
    console.log('\n--- Test 17: Partial Profile Handling ---');
    const partialDocRes = await makeRequest(TEST_PORT, 'POST', '/api/profiles', {
      basicInfo: {
        name: 'Minimal Candidate',
      },
    });
    const minimalId = partialDocRes.data?.data?.profile?._id;
    const minimalUnifiedRes = await makeRequest(TEST_PORT, 'GET', `/api/profiles/${minimalId}/unified`);
    assert(
      minimalUnifiedRes.status === 200 &&
      minimalUnifiedRes.data?.data?.candidate?.projects?.length === 0 &&
      minimalUnifiedRes.data?.data?.candidate?.experience?.length === 0,
      'Test 17a: Minimal profile normalizes safely with empty arrays'
    );
    assert(
      minimalUnifiedRes.data?.data?.profileCompleteness <= 10,
      'Test 17b: Minimal profile has low deterministic completeness score'
    );

    // 18. Verify existing resume, GitHub, and coding-profile data are preserved
    console.log('\n--- Test 18: Preserving Resume, GitHub, and Coding Profiles ---');
    // Inject mock GitHub, coding profiles, and resume into candidate
    await CandidateProfile.findByIdAndUpdate(profileId, {
      $set: {
        'github.username': 'octocat',
        'github.profileUrl': 'https://github.com/octocat',
        codingProfiles: [
          {
            platform: 'leetcode',
            username: 'tourist',
            profileUrl: 'https://leetcode.com/u/tourist/',
            stats: { problemsSolved: 500, rating: 2200 },
            dataSource: 'public_endpoint',
            fetchStatus: 'completed',
          },
        ],
        documents: [
          {
            documentType: 'resume',
            fileName: 'resume.pdf',
            extractedText: 'Full Stack Engineer with 5 years experience in Node.js and MongoDB.',
            extractionStatus: 'completed',
          },
        ],
      },
    });

    const enrichedUnifiedRes = await makeRequest(TEST_PORT, 'GET', `/api/profiles/${profileId}/unified`);
    const c = enrichedUnifiedRes.data?.data?.candidate;
    assert(c?.github?.username === 'octocat', 'Test 18a: GitHub telemetry preserved in unified profile');
    assert(c?.codingProfiles?.length === 1 && c?.codingProfiles[0]?.platform === 'leetcode', 'Test 18b: Coding profiles preserved');
    assert(c?.resume?.hasResume === true && c?.resume?.resumeText.includes('Full Stack Engineer'), 'Test 18c: Resume text and evidence preserved');

    // Verify existing GET /api/profiles/:id still functions seamlessly
    const standardGetRes = await makeRequest(TEST_PORT, 'GET', `/api/profiles/${profileId}`);
    assert(
      standardGetRes.status === 200 &&
      standardGetRes.data?.data?.profile?.basicInfo?.name === 'Asati Unified Tester',
      'Test 18d: Existing GET /api/profiles/:id backward compatibility verified'
    );

  } catch (err) {
    console.error('Test Suite Exception:', err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runUnifiedProfileTests().catch((err) => {
  console.error('Execution Failed:', err);
  process.exit(1);
});
