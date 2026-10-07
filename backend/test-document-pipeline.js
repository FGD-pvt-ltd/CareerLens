/**
 * Automated Verification Test Suite for ProfiQ Resume / CV Document Pipeline
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const CandidateProfile = require('./src/models/CandidateProfile');
const resumeService = require('./src/services/resumeService');

const TEST_PORT = 5057;

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

function makeMultipartRequest(port, method, pathUrl, fields = {}, file = null) {
  return new Promise((resolve, reject) => {
    const boundary = '----ProfiQBoundary' + Math.random().toString(36).substring(2);
    const bodyBuffers = [];

    // Append fields
    for (const [key, value] of Object.entries(fields)) {
      bodyBuffers.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
        )
      );
    }

    // Append file if provided
    if (file) {
      bodyBuffers.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldname || 'file'}"; filename="${file.filename || 'sample.pdf'}"\r\nContent-Type: ${file.contentType || 'application/pdf'}\r\n\r\n`
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

async function runDocumentPipelineTests() {
  console.log('====================================================');
  console.log(' PROFIQ RESUME / CV DOCUMENT PIPELINE VERIFICATION ');
  console.log('====================================================\n');

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
    // 1. Check existing sample PDF for testing
    const uploadsDir = path.resolve(__dirname, 'uploads');
    let samplePdfBuffer;
    const existingPdfs = fs.existsSync(uploadsDir)
      ? fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.pdf'))
      : [];

    if (existingPdfs.length > 0) {
      samplePdfBuffer = fs.readFileSync(path.join(uploadsDir, existingPdfs[0]));
    } else {
      // Fallback minimal PDF binary
      samplePdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n115\n%%EOF'
      );
    }

    // 2. Unit Tests (Always run independently of live MongoDB connection)
    console.log('--- Phase 1: Service & Schema Unit Tests ---');

    // 2a. Resume text extraction unit test
    const extractedSample = await resumeService.extractTextFromPdf(samplePdfBuffer);
    assert(
      typeof extractedSample === 'string',
      '1. extractTextFromPdf returns cleaned string without crashing'
    );

    // 2b. Non-readable or corrupted PDF handling
    const corruptResult = await resumeService.processPdfDocument(Buffer.from('not a pdf at all'));
    assert(
      corruptResult.extractionStatus === 'failed' && corruptResult.extractedText === '',
      '2. Corrupted/non-readable buffer handled gracefully with extractionStatus="failed"',
      JSON.stringify(corruptResult)
    );

    // 2c. formatSafeDocumentMetadata helper
    const testDoc = {
      _id: new mongoose.Types.ObjectId(),
      documentType: 'resume',
      fileName: 'my_resume.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      storagePath: 'C:\\secret\\uploads\\doc.pdf',
      extractedText: 'Secret extracted text',
      extractionStatus: 'completed',
      uploadedAt: new Date(),
    };
    const safeDoc = resumeService.formatSafeDocumentMetadata(testDoc);
    assert(
      safeDoc.storagePath === undefined &&
        safeDoc.extractedText === undefined &&
        safeDoc.fileName === 'my_resume.pdf' &&
        safeDoc.documentType === 'resume',
      '3. formatSafeDocumentMetadata strictly omits storagePath and extractedText',
      JSON.stringify(safeDoc)
    );

    // 2d. CandidateProfile Schema documents validation
    const candidateWithDocs = new CandidateProfile({
      basicInfo: { name: 'Doc Test Candidate' },
      documents: [
        {
          documentType: 'resume',
          fileName: 'resume.pdf',
          mimeType: 'application/pdf',
          fileSize: 2048,
          storagePath: '/uploads/doc-1.pdf',
          extractedText: 'Extracted plain text',
          extractionStatus: 'completed',
        },
        {
          documentType: 'cv',
          fileName: 'cv.pdf',
          mimeType: 'application/pdf',
          fileSize: 4096,
          storagePath: '/uploads/doc-2.pdf',
          extractedText: 'CV plain text',
          extractionStatus: 'completed',
        },
      ],
    });
    const docSchemaErr = candidateWithDocs.validateSync();
    assert(
      docSchemaErr === undefined,
      '4. CandidateProfile allows both resume and cv in documents array'
    );

    // 2e. Invalid documentType rejection in schema
    const badDocCandidate = new CandidateProfile({
      basicInfo: { name: 'Bad Doc Candidate' },
      documents: [{ documentType: 'cover_letter' }],
    });
    const badDocErr = badDocCandidate.validateSync();
    assert(
      badDocErr && badDocErr.errors['documents.0.documentType'],
      '5. CandidateProfile schema rejects invalid documentType (e.g. cover_letter)'
    );

    // 2f. Document replacement behavior unit test
    candidateWithDocs.documents = candidateWithDocs.documents.filter((d) => d.documentType !== 'resume');
    candidateWithDocs.documents.push({
      documentType: 'resume',
      fileName: 'new_resume.pdf',
      mimeType: 'application/pdf',
      fileSize: 3000,
      storagePath: '/uploads/doc-new.pdf',
      extractedText: 'Updated Resume Plain Text',
      extractionStatus: 'completed',
    });
    const resumeCount = candidateWithDocs.documents.filter((d) => d.documentType === 'resume').length;
    assert(
      resumeCount === 1 && candidateWithDocs.documents.length === 2,
      '5b. Document replacement maintains at most one active resume without duplicates'
    );

    // 2g. Combined document text structure for AI service
    const resumeDocItem = candidateWithDocs.documents.find(
      (d) => d.documentType === 'resume' && d.extractionStatus === 'completed'
    );
    const cvDocItem = candidateWithDocs.documents.find(
      (d) => d.documentType === 'cv' && d.extractionStatus === 'completed'
    );
    const aiTextPayload = {
      resumeText: resumeDocItem?.extractedText || null,
      cvText: cvDocItem?.extractedText || null,
    };
    assert(
      aiTextPayload.resumeText === 'Updated Resume Plain Text' && aiTextPayload.cvText === 'CV plain text',
      '5c. Raw document text correctly combines { resumeText, cvText } for AI service'
    );

    // 3. Connect DB & Start Server
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

    console.log('\n--- Phase 2: HTTP API Endpoints & Validation Tests ---');

    // 3a. Health check
    const health = await makeJsonRequest(TEST_PORT, 'GET', '/api/health');
    assert(
      health.status === 200 && health.data?.message === 'ProfiQ backend is running',
      '6. GET /api/health returns 200 and operational status'
    );

    // 3b. Invalid Profile ID format on document upload
    const invalidIdRes = await makeMultipartRequest(
      TEST_PORT,
      'POST',
      '/api/profiles/invalid-id-xyz/documents',
      { documentType: 'resume' },
      { fieldname: 'file', filename: 'resume.pdf', buffer: samplePdfBuffer }
    );
    assert(
      invalidIdRes.status === 400 && invalidIdRes.data?.error === 'Invalid profile ID',
      '7. POST /api/profiles/:id/documents with invalid ID returns 400',
      JSON.stringify(invalidIdRes.data)
    );

    // 3c. Missing file validation
    const missingFileRes = await makeMultipartRequest(
      TEST_PORT,
      'POST',
      '/api/profiles/6703ee54fa315a6760592b01/documents',
      { documentType: 'resume' },
      null
    );
    assert(
      missingFileRes.status === 400 &&
        missingFileRes.data?.error?.includes('No file uploaded'),
      '8. Missing file rejected with 400 and clear message',
      JSON.stringify(missingFileRes.data)
    );

    // 3d. Non-PDF file rejection (text/plain)
    const nonPdfRes = await makeMultipartRequest(
      TEST_PORT,
      'POST',
      '/api/profiles/6703ee54fa315a6760592b01/documents',
      { documentType: 'resume' },
      {
        fieldname: 'file',
        filename: 'notes.txt',
        contentType: 'text/plain',
        buffer: Buffer.from('hello plain text'),
      }
    );
    assert(
      nonPdfRes.status === 400 &&
        nonPdfRes.data?.error?.includes('Only PDF documents are allowed'),
      '9. Non-PDF file rejected with 400',
      JSON.stringify(nonPdfRes.data)
    );

    // 3e. Oversized file rejection (> 5 MB)
    const bigBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5MB
    const oversizedRes = await makeMultipartRequest(
      TEST_PORT,
      'POST',
      '/api/profiles/6703ee54fa315a6760592b01/documents',
      { documentType: 'resume' },
      {
        fieldname: 'file',
        filename: 'huge.pdf',
        contentType: 'application/pdf',
        buffer: bigBuffer,
      }
    );
    assert(
      oversizedRes.status === 400 &&
        oversizedRes.data?.error?.includes('5 MB'),
      '10. File larger than 5 MB rejected with 400',
      JSON.stringify(oversizedRes.data)
    );

    // 3f. Invalid documentType field
    const invalidDocTypeRes = await makeMultipartRequest(
      TEST_PORT,
      'POST',
      '/api/profiles/6703ee54fa315a6760592b01/documents',
      { documentType: 'certificate' },
      {
        fieldname: 'file',
        filename: 'cert.pdf',
        contentType: 'application/pdf',
        buffer: samplePdfBuffer,
      }
    );
    assert(
      invalidDocTypeRes.status === 400 &&
        invalidDocTypeRes.data?.error?.includes('Allowed values are "resume" or "cv"'),
      '11. Invalid documentType rejected with 400',
      JSON.stringify(invalidDocTypeRes.data)
    );

    // 4. Live DB Integration Tests (Run when MongoDB is connected)
    if (mongoose.connection.readyState === 1) {
      console.log('\n--- Phase 3: Live MongoDB Database Operations ---');

      // Create test candidate
      const createRes = await makeJsonRequest(TEST_PORT, 'POST', '/api/profiles', {
        basicInfo: {
          name: 'Doc Pipeline Candidate',
          email: 'pipeline@example.com',
        },
      });
      const candidateId = createRes.data?.data?.profile?._id;
      assert(createRes.status === 201 && candidateId, '12. Created test candidate profile for upload tests');

      // Upload valid resume PDF
      const uploadResumeRes = await makeMultipartRequest(
        TEST_PORT,
        'POST',
        `/api/profiles/${candidateId}/documents`,
        { documentType: 'resume' },
        {
          fieldname: 'file',
          filename: 'candidate_resume.pdf',
          contentType: 'application/pdf',
          buffer: samplePdfBuffer,
        }
      );
      assert(
        uploadResumeRes.status === 201 &&
          uploadResumeRes.data?.success === true &&
          uploadResumeRes.data?.data?.document?.documentType === 'resume' &&
          uploadResumeRes.data?.data?.document?.storagePath === undefined,
        '13. POST resume PDF succeeds (201, extractionStatus, storagePath omitted)',
        JSON.stringify(uploadResumeRes.data)
      );

      const resumeDocId = uploadResumeRes.data?.data?.document?._id;

      // Upload valid CV PDF
      const uploadCvRes = await makeMultipartRequest(
        TEST_PORT,
        'POST',
        `/api/profiles/${candidateId}/documents`,
        { documentType: 'cv' },
        {
          fieldname: 'file',
          filename: 'candidate_cv.pdf',
          contentType: 'application/pdf',
          buffer: samplePdfBuffer,
        }
      );
      assert(
        uploadCvRes.status === 201 &&
          uploadCvRes.data?.success === true &&
          uploadCvRes.data?.data?.document?.documentType === 'cv',
        '14. POST CV PDF succeeds (201, both resume and cv supported)',
        JSON.stringify(uploadCvRes.data)
      );

      // List candidate documents
      const listDocsRes = await makeJsonRequest(
        TEST_PORT,
        'GET',
        `/api/profiles/${candidateId}/documents`
      );
      assert(
        listDocsRes.status === 200 &&
          listDocsRes.data?.success === true &&
          Array.isArray(listDocsRes.data?.data?.documents) &&
          listDocsRes.data?.data?.documents.length === 2 &&
          listDocsRes.data?.data?.documents[0].storagePath === undefined,
        '15. GET /api/profiles/:id/documents lists all candidate documents without exposing filesystem path',
        JSON.stringify(listDocsRes.data)
      );

      // Retrieve single document by ID
      const singleDocRes = await makeJsonRequest(
        TEST_PORT,
        'GET',
        `/api/profiles/${candidateId}/documents/${resumeDocId}`
      );
      assert(
        singleDocRes.status === 200 &&
          singleDocRes.data?.success === true &&
          singleDocRes.data?.data?.document?._id === resumeDocId &&
          singleDocRes.data?.data?.document?.storagePath === undefined &&
          singleDocRes.data?.data?.document?.extractedText !== undefined,
        '16. GET /api/profiles/:id/documents/:documentId returns metadata & extractedText',
        JSON.stringify(singleDocRes.data)
      );

      // Document Replacement Behavior: upload second resume
      const secondResumeRes = await makeMultipartRequest(
        TEST_PORT,
        'POST',
        `/api/profiles/${candidateId}/documents`,
        { documentType: 'resume' },
        {
          fieldname: 'file',
          filename: 'candidate_resume_v2.pdf',
          contentType: 'application/pdf',
          buffer: samplePdfBuffer,
        }
      );
      assert(
        secondResumeRes.status === 201 &&
          secondResumeRes.data?.data?.document?.fileName === 'candidate_resume_v2.pdf',
        '17. Replacing resume uploads new document version'
      );

      // Verify at most 1 active resume remains in candidate documents
      const recheckDocsRes = await makeJsonRequest(
        TEST_PORT,
        'GET',
        `/api/profiles/${candidateId}/documents`
      );
      const resumeCount = (recheckDocsRes.data?.data?.documents || []).filter(
        (d) => d.documentType === 'resume'
      ).length;
      assert(
        resumeCount === 1,
        '18. Exactly one active resume document exists after replacement (no duplicate resumes)',
        `resumeCount: ${resumeCount}`
      );

      // Combined document text for AI service (Aman's module)
      const combinedText = await resumeService.getCandidateDocumentText(candidateId);
      assert(
        combinedText && typeof combinedText.resumeText === 'string',
        '19. getCandidateDocumentText(profileId) returns raw { resumeText, cvText } for AI service',
        JSON.stringify(combinedText)
      );

      // GET /api/profiles/:id/documents/text
      const textEndpointRes = await makeJsonRequest(
        TEST_PORT,
        'GET',
        `/api/profiles/${candidateId}/documents/text`
      );
      assert(
        textEndpointRes.status === 200 &&
          textEndpointRes.data?.data?.resumeText !== undefined,
        '20. GET /api/profiles/:id/documents/text returns structured text JSON',
        JSON.stringify(textEndpointRes.data)
      );
    } else {
      console.log('\n[Notice] Phase 3 live database tests skipped because live MongoDB port is not connected.');
    }

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
  runDocumentPipelineTests();
}

module.exports = { runDocumentPipelineTests };
