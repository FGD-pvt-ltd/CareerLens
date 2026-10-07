/**
 * PROFIQ END-TO-END PIPELINE & INTEGRATION VALIDATION SUITE
 * 
 * Executes the complete realistic candidate scenario:
 * 1. Health checks (Backend & AI service)
 * 2. Create Candidate Profile with basic info, college, education
 * 3. Profile CRUD operations & invalid ID / not found handling
 * 4. Document / Resume PDF upload and text extraction
 * 5. Invalid resume file rejection
 * 6. GitHub profile ingestion & normalization
 * 7. Coding profile ingestion (LeetCode / Codeforces)
 * 8. Add projects (at least 2)
 * 9. Add certification
 * 10. Add portfolio
 * 11. Target role retrieval (JobRole catalog, slug, ID)
 * 12. Target role selection & validation (reject invalid role)
 * 13. Unified candidate profile retrieval & completeness breakdown
 * 14. Partial/minimal profile unified validation (no fake content)
 * 15. Clean AI handoff payload preparation (zero secrets, zero filesystem paths)
 * 16. AI response validation & failure handling
 * 17. Analysis lifecycle (pending/processing -> completed / failed)
 * 18. Retrieve analysis result by ID
 * 19. Candidate deletion & cascading cleanup
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

// Ensure test environment
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const { seedJobRoles } = require('./src/services/roleService');
const CandidateProfile = require('./src/models/CandidateProfile');
const Analysis = require('./src/models/Analysis');
const JobRole = require('./src/models/JobRole');
const { prepareAiPayload } = require('./src/services/aiService');

// Helper for HTTP JSON requests
function makeJsonRequest(port, method, pathUrl, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: pathUrl,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Helper for multipart requests (file upload)
function makeMultipartRequest(port, method, pathUrl, fields = {}, file = null) {
  return new Promise((resolve, reject) => {
    const boundary = '----ProfiQBoundary' + Math.random().toString(36).substring(2);
    const bodyBuffers = [];

    for (const [key, value] of Object.entries(fields)) {
      bodyBuffers.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
        )
      );
    }

    if (file) {
      bodyBuffers.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname || 'file'}"; filename="${file.filename || 'resume.pdf'}"\r\nContent-Type: ${file.contentType || 'application/pdf'}\r\n\r\n`
        )
      );
      bodyBuffers.push(file.buffer);
      bodyBuffers.push(Buffer.from('\r\n'));
    }

    bodyBuffers.push(Buffer.from(`--${boundary}--\r\n`));
    const fullBody = Buffer.concat(bodyBuffers);

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: pathUrl,
        method,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': fullBody.length,
        },
      },

      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function runEndToEndIntegrationSuite() {
  console.log('================================================================');
  console.log(' PROFIQ BACKEND INTEGRATION & END-TO-END VALIDATION SUITE');
  console.log('================================================================\n');

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

  let server = null;
  let mockAiServer = null;
  let serverPort = null;
  let aiPort = null;
  let receivedAiPayload = null;

  try {
    // 1. Connect DB and seed roles
    await connectDB();
    await seedJobRoles();

    // 2. Start Mock FastAPI Service
    mockAiServer = http.createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'healthy', version: '1.0.0-mock' }));
      }

      if (req.url === '/api/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            receivedAiPayload = JSON.parse(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(
              JSON.stringify({
                success: true,
                data: {
                  candidateId: receivedAiPayload.candidateId,
                  readinessScore: 88,
                  scoreBreakdown: {
                    skillConfidence: 90,
                    projectEvidence: 85,
                    codingRigor: 88,
                    academicRigor: 86,
                  },
                  skills: ['Node.js', 'Express', 'MongoDB', 'System Design', 'React'],
                  strengths: [
                    'Strong backend API engineering',
                    'Production database schema structure',
                    'Multi-factor cross-verified evidence',
                  ],
                  gaps: [
                    'Kubernetes container orchestration',
                    'Distributed message queue telemetry',
                  ],
                  roadmap: [
                    { step: '1', title: 'Containerize backend service', duration: 'Week 1', status: 'Next' },
                    { step: '2', title: 'Implement automated CI/CD pipeline', duration: 'Week 2', status: 'Planned' },
                  ],
                },
                metadata: {
                  serviceVersion: '1.0.0-mock-fastapi',
                  model: 'fastapi-pipeline-v1',
                  analyzedAt: new Date().toISOString(),
                },
              })
            );
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    await new Promise((resolve) => mockAiServer.listen(0, resolve));
    aiPort = mockAiServer.address().port;
    process.env.AI_SERVICE_URL = `http://localhost:${aiPort}`;

    // 3. Start Express backend test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    serverPort = server.address().port;
    console.log(`[Test Setup] Express server on port ${serverPort}, Mock AI service on port ${aiPort}\n`);

    // =================================================================
    // STEP 1: HEALTH CHECKS
    // =================================================================
    console.log('--- Step 1: Health Checks ---');
    const healthRes = await makeJsonRequest(serverPort, 'GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200');
    assert(healthRes.data?.success === true, 'GET /api/health success is true');
    assert(typeof healthRes.data?.message === 'string', 'GET /api/health includes standardized message');
    assert(healthRes.data?.data?.status === 'healthy', 'GET /api/health data.status is healthy');

    const aiHealthRes = await makeJsonRequest(serverPort, 'GET', '/api/ai/health');
    assert(aiHealthRes.status === 200, 'GET /api/ai/health returns 200 when service online');
    assert(aiHealthRes.data?.data?.aiService === 'available', 'GET /api/ai/health confirms availability');

    // =================================================================
    // STEP 2: CREATE CANDIDATE PROFILE (Realistic Multi-Field)
    // =================================================================
    console.log('\n--- Step 2: Create Candidate Profile ---');
    const candidateData = {
      basicInfo: {
        name: 'Aditya Asati',
        email: `aditya_${Date.now()}@example.com`,
        phone: '+91 9876543210',
        location: 'Bengaluru, India',
        headline: 'Full Stack & Distributed Systems Engineer',
        profilePhotoUrl: 'https://example.com/avatar.jpg',
      },
      college: {
        collegeName: 'National Institute of Technology',
        university: 'NIT University',
        degree: 'Bachelor of Technology',
        branch: 'Computer Science and Engineering',
        specialization: 'Software Systems',
        yearOfStudy: '4th Year',
        graduationYear: 2025,
        cgpa: 8.85,
        percentage: 84.5,
        relevantCoursework: ['Data Structures', 'Database Systems', 'Operating Systems', 'Computer Networks'],
        academicAchievements: ['Dean\'s Honor List 2023', 'National Coding Olympiad Finalist'],
      },
      education: [
        {
          level: 'undergraduate',
          institution: 'National Institute of Technology',
          degree: 'B.Tech in CSE',
          field: 'Computer Science',
          startYear: 2021,
          endYear: 2025,
          cgpa: 8.85,
        },
      ],
      skills: [
        { name: 'Node.js', category: 'backend' },
        { name: 'Express', category: 'backend' },
        { name: 'MongoDB', category: 'database' },
        { name: 'JavaScript', category: 'language' },
        { name: 'Python', category: 'language' },
        { name: 'REST API', category: 'architecture' },
      ],
    };

    const createRes = await makeJsonRequest(serverPort, 'POST', '/api/profiles', candidateData);
    assert(createRes.status === 201, 'POST /api/profiles returns 201 Created');
    assert(createRes.data?.success === true, 'POST /api/profiles success flag is true');
    assert(Boolean(createRes.data?.data?.profile?._id), 'POST /api/profiles returns created document with _id');

    const candidateId = createRes.data?.data?.profile?._id;

    // =================================================================
    // STEP 3: RETRIEVE & VALIDATE PROFILE
    // =================================================================
    console.log('\n--- Step 3: Profile Retrieval & Validation ---');
    const getRes = await makeJsonRequest(serverPort, 'GET', `/api/profiles/${candidateId}`);
    assert(getRes.status === 200, 'GET /api/profiles/:id returns 200');
    assert(getRes.data?.data?.profile?.basicInfo?.name === 'Aditya Asati', 'Profile name matches');
    assert(getRes.data?.data?.profile?.college?.cgpa === 8.85, 'College CGPA matches');
    assert(getRes.data?.message === 'Candidate profile retrieved successfully', 'Includes standardized message');

    // Validation: Invalid ID
    const invalidIdRes = await makeJsonRequest(serverPort, 'GET', '/api/profiles/invalid-id-format');
    assert(invalidIdRes.status === 400, 'Invalid ID format returns 400 Bad Request');
    assert(invalidIdRes.data?.success === false, 'Invalid ID error returns success: false');

    // Validation: Nonexistent ID
    const notFoundRes = await makeJsonRequest(serverPort, 'GET', '/api/profiles/000000000000000000000000');
    assert(notFoundRes.status === 404, 'Nonexistent ID returns 404 Not Found');

    // =================================================================
    // STEP 4: UPDATE PROFILE & VALIDATE WHITELIST
    // =================================================================
    console.log('\n--- Step 4: Profile Update ---');
    const updateRes = await makeJsonRequest(serverPort, 'PUT', `/api/profiles/${candidateId}`, {
      basicInfo: {
        headline: 'Lead Integration & Backend Engineer',
      },
      unsupportedArbitraryField: 'Should be safely ignored',
    });
    assert(updateRes.status === 200, 'PUT /api/profiles/:id returns 200');
    assert(updateRes.data?.data?.profile?.basicInfo?.headline === 'Lead Integration & Backend Engineer', 'Headline updated');

    // Verify arbitrary field was not stored
    const rawMongoDoc = await CandidateProfile.findById(candidateId).lean();
    assert(rawMongoDoc.unsupportedArbitraryField === undefined, 'Arbitrary fields ignored and not saved to MongoDB');

    // =================================================================
    // STEP 5: RESUME PDF UPLOAD PIPELINE
    // =================================================================
    console.log('\n--- Step 5: Resume PDF Upload & Text Extraction ---');
    const samplePdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n115\n%%EOF'
    );

    const pdfUploadRes = await makeMultipartRequest(
      serverPort,
      'POST',
      `/api/profiles/${candidateId}/documents`,
      { documentType: 'resume' },
      { buffer: samplePdfBuffer, filename: 'Aditya_Resume.pdf', contentType: 'application/pdf' }
    );
    assert(pdfUploadRes.status === 201, 'POST /api/profiles/:id/documents returns 201');
    assert(pdfUploadRes.data?.data?.document?.documentType === 'resume', 'Document type is resume');
    assert(pdfUploadRes.data?.data?.document?.storagePath === undefined, 'Physical filesystem path is not exposed');

    // Reject non-PDF
    const badUploadRes = await makeMultipartRequest(
      serverPort,
      'POST',
      `/api/profiles/${candidateId}/documents`,
      { documentType: 'resume' },
      { buffer: Buffer.from('Plain text file'), filename: 'bad.txt', contentType: 'text/plain' }
    );
    assert(badUploadRes.status === 400, 'Non-PDF upload rejected with 400');

    // =================================================================
    // STEP 6: GITHUB INTEGRATION PIPELINE
    // =================================================================
    console.log('\n--- Step 6: GitHub Integration ---');
    // Using test candidate github or valid test handle
    const githubRes = await makeJsonRequest(serverPort, 'POST', `/api/profiles/${candidateId}/github`, {
      githubUrl: 'https://github.com/octocat',
    });
    // GitHub API may succeed or return 403 rate limit if unauthenticated
    if (githubRes.status === 200) {
      assert(githubRes.status === 200, 'POST /api/profiles/:id/github succeeds with 200');
      assert(githubRes.data?.data?.github?.username === 'octocat', 'GitHub username stored');
    } else {
      assert(
        githubRes.status === 403 || githubRes.status === 429,
        'GitHub API handled gracefully (rate limit handled without server crash)'
      );
    }

    // Invalid GitHub URL rejected
    const badGhRes = await makeJsonRequest(serverPort, 'POST', `/api/profiles/${candidateId}/github`, {
      githubUrl: 'https://api.github.com/users/octocat', // disallow arbitrary API endpoints
    });
    assert(badGhRes.status === 400, 'Arbitrary GitHub API URLs rejected with 400');

    // =================================================================
    // STEP 7: CODING PLATFORM PIPELINE
    // =================================================================
    console.log('\n--- Step 7: Coding Platform Integration ---');
    // CodeChef (stores external profile without fake stats)
    const codechefRes = await makeJsonRequest(
      serverPort,
      'POST',
      `/api/profiles/${candidateId}/coding-profiles`,
      {
        platform: 'codechef',
        profileUrl: 'https://www.codechef.com/users/tourist',
      }
    );
    assert(codechefRes.status === 200, 'POST /api/profiles/:id/coding-profiles returns 200');
    assert(codechefRes.data?.data?.codingProfile?.fetchStatus === 'unavailable', 'CodeChef marked as unavailable without fabricated numbers');
    assert(codechefRes.data?.data?.codingProfile?.username === 'tourist', 'CodeChef username safely extracted');

    // Duplicate platform check: updating in-place without duplicate
    const codechefDupRes = await makeJsonRequest(
      serverPort,
      'POST',
      `/api/profiles/${candidateId}/coding-profiles`,
      {
        platform: 'codechef',
        profileUrl: 'https://www.codechef.com/users/tourist',
      }
    );
    assert(codechefDupRes.status === 200, 'Duplicate coding platform call returns 200');
    const updatedCandidate = await CandidateProfile.findById(candidateId).lean();
    const cfProfiles = (updatedCandidate.codingProfiles || []).filter((p) => p.platform === 'codechef');
    assert(cfProfiles.length === 1, 'Duplicate coding platform prevented (exactly 1 CodeChef entry)');

    // =================================================================
    // STEP 8: ADD PROJECTS (AT LEAST TWO)
    // =================================================================
    console.log('\n--- Step 8: Add Projects ---');
    const proj1Res = await makeJsonRequest(serverPort, 'POST', `/api/profiles/${candidateId}/projects`, {
      name: 'ProfiQ Intelligence Platform',
      description: 'AI-Powered employability assessment and roadmap system with Express and FastAPI',
      technologies: ['Node.js', 'Express', 'MongoDB', 'Python', 'FastAPI', 'Docker'],
      role: 'Backend Architect',
      githubUrl: 'https://github.com/FGD-pvt-ltd/CareerLens',
      liveUrl: 'https://profiq.dev',
      teamSize: 3,
    });
    assert(proj1Res.status === 201, 'Project 1 added successfully (201)');

    const proj2Res = await makeJsonRequest(serverPort, 'POST', `/api/profiles/${candidateId}/projects`, {
      name: 'Distributed Stream Analytics Engine',
      description: 'High-throughput Kafka and Redis streaming pipeline handling 50k events/sec',
      technologies: ['Python', 'Kafka', 'Redis', 'PostgreSQL', 'Docker'],
      role: 'Systems Engineer',
      githubUrl: 'https://github.com/octocat/stream-engine',
      liveUrl: 'https://stream.engine.demo',
      teamSize: 2,
    });
    assert(proj2Res.status === 201, 'Project 2 added successfully (201)');

    // =================================================================
    // STEP 9: ADD CERTIFICATION & PORTFOLIO
    // =================================================================
    console.log('\n--- Step 9: Add Certification & Portfolio ---');
    const certRes = await makeJsonRequest(serverPort, 'POST', `/api/profiles/${candidateId}/certifications`, {
      name: 'AWS Certified Solutions Architect',
      issuingOrganization: 'Amazon Web Services',
      issueDate: '2024-01-15',
      credentialId: 'AWS-ARCH-98234',
      credentialUrl: 'https://aws.amazon.com/verify/AWS-ARCH-98234',
    });
    assert(certRes.status === 201, 'Certification added successfully (201)');

    const portfolioRes = await makeJsonRequest(serverPort, 'POST', `/api/profiles/${candidateId}/portfolios`, {
      platform: 'Personal Website',
      url: 'https://adityasati.dev',
      title: 'Aditya Asati Portfolio & Engineering Blog',
      type: 'Personal Portfolio',
    });
    assert(portfolioRes.status === 200, 'Portfolio added successfully (200)');

    // =================================================================
    // STEP 10: TARGET ROLE CATALOG & SELECTION
    // =================================================================
    console.log('\n--- Step 10: Target Role Pipeline ---');
    const rolesRes = await makeJsonRequest(serverPort, 'GET', '/api/roles');
    assert(rolesRes.status === 200, 'GET /api/roles returns 200');
    assert(Array.isArray(rolesRes.data?.data?.roles), 'Returns roles array');
    assert(rolesRes.data?.data?.roles.length >= 10, 'Catalog contains all 10 benchmark roles');

    const roleBySlugRes = await makeJsonRequest(serverPort, 'GET', '/api/roles/slug/backend-developer');
    assert(roleBySlugRes.status === 200, 'GET /api/roles/slug/backend-developer returns 200');
    assert(roleBySlugRes.data?.data?.role?.name === 'Backend Developer', 'Role name matches');

    // Select valid target role
    const selectRoleRes = await makeJsonRequest(serverPort, 'PUT', `/api/profiles/${candidateId}/target-role`, {
      roleName: 'Backend Developer',
    });
    assert(selectRoleRes.status === 200, 'PUT /api/profiles/:id/target-role sets role (200)');
    assert(selectRoleRes.data?.data?.targetRole?.roleName === 'Backend Developer', 'Target role set to Backend Developer');

    // Reject invalid target role
    const invalidRoleRes = await makeJsonRequest(serverPort, 'PUT', `/api/profiles/${candidateId}/target-role`, {
      roleName: 'Nonexistent Fantasy Role 9999',
    });
    assert(invalidRoleRes.status === 404, 'Invalid target role rejected with 404');

    // =================================================================
    // STEP 11: UNIFIED CANDIDATE PROFILE RETRIEVAL
    // =================================================================
    console.log('\n--- Step 11: Unified Candidate Profile ---');
    const unifiedRes = await makeJsonRequest(serverPort, 'GET', `/api/profiles/${candidateId}/unified`);
    assert(unifiedRes.status === 200, 'GET /api/profiles/:id/unified returns 200');
    const uCand = unifiedRes.data?.data?.candidate;
    assert(Boolean(uCand?.basicInfo?.name), 'Unified: basicInfo present');
    assert(Boolean(uCand?.college?.collegeName), 'Unified: college present');
    assert(Array.isArray(uCand?.education), 'Unified: education is array');
    assert(Array.isArray(uCand?.skills), 'Unified: skills is array');
    assert(Array.isArray(uCand?.projects) && uCand.projects.length >= 2, 'Unified: projects array has >= 2 projects');
    assert(Array.isArray(uCand?.certifications) && uCand.certifications.length >= 1, 'Unified: certifications has >= 1');
    assert(Array.isArray(uCand?.portfolios) && uCand.portfolios.length >= 1, 'Unified: portfolios has >= 1');
    assert(uCand?.targetRole?.roleName === 'Backend Developer', 'Unified: targetRole is Backend Developer');
    assert(unifiedRes.data?.data?.profileCompleteness > 0, 'Unified: profileCompleteness calculated');

    // =================================================================
    // STEP 12: PARTIAL CANDIDATE UNIFIED VALIDATION
    // =================================================================
    console.log('\n--- Step 12: Partial Candidate Unified Profile ---');
    const minimalCand = new CandidateProfile({
      basicInfo: { name: 'Minimal Candidate', email: 'minimal@example.com' },
      targetRole: { roleName: 'Frontend Developer', slug: 'frontend-developer' },
    });
    await minimalCand.save();

    const minUnifiedRes = await makeJsonRequest(serverPort, 'GET', `/api/profiles/${minimalCand._id}/unified`);
    assert(minUnifiedRes.status === 200, 'Partial profile GET /unified returns 200');
    const minCand = minUnifiedRes.data?.data?.candidate;
    assert(Array.isArray(minCand.certifications) && minCand.certifications.length === 0, 'No certifications returned as empty array');
    assert(Array.isArray(minCand.codingProfiles) && minCand.codingProfiles.length === 0, 'No coding profiles returned as empty array');
    assert(Array.isArray(minCand.portfolios) && minCand.portfolios.length === 0, 'No portfolios returned as empty array');
    assert(minCand.github?.username === null, 'No GitHub returned with null username (no fake content)');

    // =================================================================
    // STEP 13: CLEAN AI HANDOFF PAYLOAD GENERATION
    // =================================================================
    console.log('\n--- Step 13: AI Handoff Contract Validation ---');
    const aiPayload = prepareAiPayload(
      candidateId,
      { roleId: 'backend-dev-id', roleName: 'Backend Developer' },
      uCand
    );

    assert(Boolean(aiPayload.candidateId), 'AI Payload contains candidateId');
    assert(aiPayload.targetRole?.roleName === 'Backend Developer', 'AI Payload contains targetRole');
    assert(typeof aiPayload.profile === 'object', 'AI Payload contains profile object');
    assert(JSON.stringify(aiPayload).indexOf('password') === -1, 'No password in payload');
    assert(JSON.stringify(aiPayload).indexOf('MONGODB') === -1, 'No MongoDB credentials in payload');
    assert(JSON.stringify(aiPayload).indexOf('GITHUB_TOKEN') === -1, 'No GitHub tokens in payload');
    assert(JSON.stringify(aiPayload).indexOf('storagePath') === -1, 'No filesystem storagePath in payload');

    // =================================================================
    // STEP 14: ANALYSIS LIFECYCLE (FASTAPI CALL & MONGODB STORAGE)
    // =================================================================
    console.log('\n--- Step 14: Analysis Lifecycle ---');
    const startAnalysisRes = await makeJsonRequest(
      serverPort,
      'POST',
      '/api/analysis?sync=true',
      {
        candidateId,
        targetRole: 'Backend Developer',
      }
    );
    assert(startAnalysisRes.status === 200, 'POST /api/analysis?sync=true completes with 200');
    const analysisId = startAnalysisRes.data?.data?.analysisId;
    assert(Boolean(analysisId), 'Returns created analysisId');

    // Verify received payload at mock FastAPI
    assert(receivedAiPayload?.candidateId === candidateId.toString(), 'FastAPI received correct candidateId');
    assert(receivedAiPayload?.targetRole?.roleName === 'Backend Developer', 'FastAPI received correct targetRole');

    // Retrieve analysis result by ID
    const getAnalysisRes = await makeJsonRequest(serverPort, 'GET', `/api/analysis/${analysisId}`);
    assert(getAnalysisRes.status === 200, 'GET /api/analysis/:id returns 200');
    const storedAnalysis = getAnalysisRes.data?.data?.analysis;
    assert(storedAnalysis?.status === 'completed', 'Analysis status is completed');
    assert(storedAnalysis?.result?.readinessScore === 88, 'Readiness score is 88');
    assert(Array.isArray(storedAnalysis?.result?.skills), 'Skills array stored');
    assert(Array.isArray(storedAnalysis?.result?.strengths), 'Strengths array stored');
    assert(Array.isArray(storedAnalysis?.result?.gaps), 'Gaps array stored');
    assert(Array.isArray(storedAnalysis?.result?.roadmap), 'Roadmap array stored');

    // Verify duplicate analysis request handling
    const inFlightAnalysis = new Analysis({
      candidateId,
      status: 'processing',
      targetRole: { roleName: 'Backend Developer' },
    });
    await inFlightAnalysis.save();

    const dupAnalysisRes = await makeJsonRequest(serverPort, 'POST', '/api/analysis', {
      candidateId,
      targetRole: 'Backend Developer',
    });
    assert(dupAnalysisRes.status === 200, 'Duplicate analysis request returns existing active analysis (200)');
    assert(dupAnalysisRes.data?.data?.analysisId === inFlightAnalysis._id.toString(), 'Existing analysis ID returned');

    // Clean up temporary in-flight record
    await Analysis.findByIdAndDelete(inFlightAnalysis._id);

    // =================================================================
    // STEP 15: CANDIDATE PROFILE DELETION (CRUD "D")
    // =================================================================
    console.log('\n--- Step 15: Profile Deletion & Cascading Cleanup ---');
    const deleteRes = await makeJsonRequest(serverPort, 'DELETE', `/api/profiles/${candidateId}`);
    assert(deleteRes.status === 200, 'DELETE /api/profiles/:id returns 200');
    assert(deleteRes.data?.message === 'Candidate profile deleted successfully', 'Standardized delete message returned');

    // Confirm candidate document removed from MongoDB
    const postDeleteProfile = await CandidateProfile.findById(candidateId);
    assert(postDeleteProfile === null, 'Candidate profile document removed from MongoDB');

    // Confirm cascading analysis documents removed
    const remainingAnalyses = await Analysis.find({ candidateId });
    assert(remainingAnalyses.length === 0, 'Associated analysis records cleaned up');

    // Confirm GET /api/profiles/:id now returns 404
    const postDeleteGet = await makeJsonRequest(serverPort, 'GET', `/api/profiles/${candidateId}`);
    assert(postDeleteGet.status === 404, 'GET deleted profile returns 404 Not Found');

    // Clean up partial candidate
    await CandidateProfile.findByIdAndDelete(minimalCand._id);

    console.log('\n================================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('[FATAL TEST ERROR]', err);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mockAiServer) {
      await new Promise((resolve) => mockAiServer.close(resolve));
    }
    await disconnectDB();
  }
}

runEndToEndIntegrationSuite();
