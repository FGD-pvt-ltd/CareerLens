const fs = require('fs');
const mongoose = require('mongoose');
const CandidateProfile = require('../models/CandidateProfile');
const resumeService = require('../services/resumeService');

/**
 * Upload and process candidate resume or CV
 * POST /api/profiles/:id/documents
 */
async function uploadCandidateDocument(req, res, next) {
  const { id } = req.params;

  // Helper to remove uploaded file if request validation fails
  const cleanupFile = () => {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('[DocumentController] Failed to clean up file:', err.message);
      }
    }
  };

  try {
    // 1. Validate profile ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    // 2. Validate uploaded file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a PDF document in the "file" field.',
      });
    }

    // 3. Validate documentType field
    const rawDocType = req.body.documentType;
    if (!rawDocType || typeof rawDocType !== 'string' || !['resume', 'cv'].includes(rawDocType.trim().toLowerCase())) {
      cleanupFile();
      return res.status(400).json({
        success: false,
        error: 'Invalid documentType. Allowed values are "resume" or "cv".',
      });
    }

    // 4. Validate candidate existence in MongoDB
    if (mongoose.connection.readyState !== 1) {
      cleanupFile();
      return res.status(500).json({
        success: false,
        error: 'Database connection error',
      });
    }

    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      cleanupFile();
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    const documentType = rawDocType.trim().toLowerCase();

    // 5. Extract text safely using resumeService
    const { extractedText, extractionStatus, message: extractionMsg } =
      await resumeService.processPdfDocument(req.file.path);

    // 6. Manage Document Replacement:
    // At most one active document of each type should normally exist.
    // Replace any previous document of the same documentType.
    if (!Array.isArray(candidate.documents)) {
      candidate.documents = [];
    }

    // Filter out previous document of the same type to maintain exactly one active document per type
    candidate.documents = candidate.documents.filter(
      (doc) => doc.documentType !== documentType
    );

    // Create new document subdocument
    const newDocument = {
      documentType,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      storagePath: req.file.path,
      extractedText: extractedText || '',
      extractionStatus,
      uploadedAt: new Date(),
    };

    candidate.documents.push(newDocument);

    // Sync legacy candidate.resume if documentType is 'resume'
    if (documentType === 'resume') {
      candidate.resume = {
        fileName: req.file.originalname,
        fileUrl: '',
        extractedText: extractedText || '',
      };
    }

    // Refresh candidate evaluation based on new document text
    try {
      const { evaluateProfile } = require('../services/analysisService');
      candidate.analysis = evaluateProfile(candidate);
    } catch (evalErr) {
      console.warn('[DocumentController] Evaluation notice:', evalErr.message);
    }

    await candidate.save();

    // Retrieve the saved document subdocument to access generated _id
    const savedDoc = candidate.documents[candidate.documents.length - 1];

    // 7. Format response (omits storagePath and raw extractedText for clean upload response)
    const safeDoc = resumeService.formatSafeDocumentMetadata(savedDoc);

    const responseMessage =
      extractionStatus === 'completed'
        ? 'Document uploaded and processed successfully'
        : `Document uploaded, but text extraction failed: ${extractionMsg}`;

    return res.status(201).json({
      success: true,
      message: responseMessage,
      data: {
        document: safeDoc,
      },
    });
  } catch (error) {
    cleanupFile();
    next(error);
  }
}

/**
 * Retrieve candidate's uploaded resume/CV metadata
 * GET /api/profiles/:id/documents
 */
async function getCandidateDocuments(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        error: 'Database connection error',
      });
    }

    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    const documents = (candidate.documents || []).map(resumeService.formatSafeDocumentMetadata);

    return res.status(200).json({
      success: true,
      message: 'Candidate documents retrieved successfully',
      data: {
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve specific document details by ID (including extractedText for inspection, omitting filesystem path)
 * GET /api/profiles/:id/documents/:documentId
 */
async function getCandidateDocumentById(req, res, next) {
  try {
    const { id, documentId } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId) || !/^[0-9a-fA-F]{24}$/.test(documentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document ID',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        error: 'Database connection error',
      });
    }

    const candidate = await CandidateProfile.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }

    const doc = (candidate.documents || []).find((d) => d._id && d._id.toString() === documentId);
    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Candidate document retrieved successfully',
      data: {
        document: {
          _id: doc._id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          extractionStatus: doc.extractionStatus,
          extractedText: doc.extractedText,
          uploadedAt: doc.uploadedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve combined raw document text for AI service consumption (Aman's module)
 * GET /api/profiles/:id/documents-text
 */
async function getCandidateDocumentTextEndpoint(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile ID',
      });
    }

    const texts = await resumeService.getCandidateDocumentText(id);

    return res.status(200).json({
      success: true,
      message: 'Candidate document text retrieved successfully',
      data: texts,
    });
  } catch (error) {
    if (error.message === 'Candidate profile not found') {
      return res.status(404).json({
        success: false,
        error: 'Candidate profile not found',
      });
    }
    next(error);
  }
}

module.exports = {
  uploadCandidateDocument,
  getCandidateDocuments,
  getCandidateDocumentById,
  getCandidateDocumentTextEndpoint,
};
