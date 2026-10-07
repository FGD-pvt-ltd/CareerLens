const express = require('express');
const documentController = require('../controllers/documentController');
const { uploadSingleDocument } = require('../middleware/uploadMiddleware');

// mergeParams: true allows accessing :id from parent router (/api/profiles/:id/documents)
const router = express.Router({ mergeParams: true });

// POST /api/profiles/:id/documents - Upload resume or CV PDF
router.post('/', uploadSingleDocument, documentController.uploadCandidateDocument);

// GET /api/profiles/:id/documents - List uploaded document metadata
router.get('/', documentController.getCandidateDocuments);

// GET /api/profiles/:id/documents/text - Get raw combined document text for AI service
router.get('/text', documentController.getCandidateDocumentTextEndpoint);

// GET /api/profiles/:id/documents/:documentId - Get document metadata and extracted text
router.get('/:documentId', documentController.getCandidateDocumentById);

module.exports = router;
