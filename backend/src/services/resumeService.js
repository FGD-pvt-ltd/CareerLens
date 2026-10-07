const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * Clean extracted text: normalize linebreaks, strip unprintable chars, trim whitespace
 */
function cleanExtractedText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove non-printable control characters
    .replace(/\n{3,}/g, '\n\n') // normalize excessive empty lines
    .trim();
}

/**
 * Extract plain text from PDF buffer or file path
 * @param {Buffer|string} filePathOrBuffer - Path to local PDF or Buffer
 * @returns {Promise<string>} Cleaned extracted plain text
 */
async function extractTextFromPdf(filePathOrBuffer) {
  let buffer;

  if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer;
  } else if (typeof filePathOrBuffer === 'string') {
    if (!fs.existsSync(filePathOrBuffer)) {
      throw new Error('PDF file does not exist on server.');
    }
    buffer = fs.readFileSync(filePathOrBuffer);
  } else {
    throw new Error('Invalid input: expected Buffer or file path string.');
  }

  try {
    const pdfModule = require('pdf-parse');

    // Handle class-based API (pdf-parse v2)
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      return cleanExtractedText(result.text || '');
    }

    // Handle function export (pdf-parse v1)
    if (typeof pdfModule === 'function') {
      const result = await pdfModule(buffer);
      return cleanExtractedText(result.text || '');
    }

    throw new Error('Unrecognized pdf-parse export structure.');
  } catch (error) {
    console.error('[ResumeService] PDF parsing failed:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Process PDF document and determine extraction status
 * @param {Buffer|string} filePathOrBuffer
 * @returns {Promise<{ extractedText: string, extractionStatus: string, message: string }>}
 */
async function processPdfDocument(filePathOrBuffer) {
  try {
    const text = await extractTextFromPdf(filePathOrBuffer);

    if (text && text.trim().length > 0) {
      return {
        extractedText: text,
        extractionStatus: 'completed',
        message: 'Text extracted successfully',
      };
    }

    // Empty or non-machine-readable PDF (e.g. pure scanned image)
    return {
      extractedText: '',
      extractionStatus: 'failed',
      message: 'Text could not be extracted from this PDF.',
    };
  } catch (error) {
    return {
      extractedText: '',
      extractionStatus: 'failed',
      message: error.message || 'Text could not be extracted from this PDF.',
    };
  }
}

/**
 * Helper to format safe document metadata for API responses (omits physical storagePath and raw text)
 */
function formatSafeDocumentMetadata(doc) {
  if (!doc) return null;
  return {
    _id: doc._id,
    documentType: doc.documentType,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    extractionStatus: doc.extractionStatus,
    uploadedAt: doc.uploadedAt,
  };
}

/**
 * Combine available document text for future AI service consumption (Aman's Python/FastAPI module)
 * Returns { resumeText: string|null, cvText: string|null }
 * Does NOT summarize, score, or alter text.
 */
async function getCandidateDocumentText(profileId) {
  const CandidateProfile = require('../models/CandidateProfile');

  if (!profileId || !mongoose.Types.ObjectId.isValid(profileId) || !/^[0-9a-fA-F]{24}$/.test(profileId)) {
    throw new Error('Invalid profile ID');
  }

  const candidate = await CandidateProfile.findById(profileId);
  if (!candidate) {
    throw new Error('Candidate profile not found');
  }

  let resumeText = null;
  let cvText = null;

  if (Array.isArray(candidate.documents)) {
    const resumeDoc = candidate.documents.find(
      (d) => d.documentType === 'resume' && d.extractionStatus === 'completed'
    );
    if (resumeDoc && resumeDoc.extractedText) {
      resumeText = resumeDoc.extractedText;
    }

    const cvDoc = candidate.documents.find(
      (d) => d.documentType === 'cv' && d.extractionStatus === 'completed'
    );
    if (cvDoc && cvDoc.extractedText) {
      cvText = cvDoc.extractedText;
    }
  }

  // Fallback to legacy candidate.resume if documents array didn't contain it
  if (!resumeText && candidate.resume && candidate.resume.extractedText) {
    resumeText = candidate.resume.extractedText;
  }

  return {
    resumeText,
    cvText,
  };
}

module.exports = {
  extractTextFromPdf,
  cleanExtractedText,
  processPdfDocument,
  formatSafeDocumentMetadata,
  getCandidateDocumentText,
};
