const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');

const UPLOAD_DIR = env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
const CERT_DIR = path.join(UPLOAD_DIR, 'certificates');

// Ensure upload directories exist safely
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

// Multer disk storage configuration for Resume/CV documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate secure random server-side filename (never using original client filename for filesystem path)
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `doc-${uniqueSuffix}.pdf`);
  },
});

// Strict PDF file filter checking both MIME type and file extension
const documentFileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'application/x-pdf'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (allowedMimes.includes(file.mimetype) && ext === '.pdf') {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF documents are allowed.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const documentMulter = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Middleware wrapper for single document upload under field 'file'.
 * Formats Multer errors into standard JSON { success: false, error: ... } responses.
 */
const uploadSingleDocument = (req, res, next) => {
  documentMulter.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds maximum allowed limit of 5 MB',
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only PDF documents are allowed.',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error',
      });
    }
    next();
  });
};

// Multer disk storage configuration for Certificates (PDF, JPG, JPEG, PNG)
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CERT_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.pdf';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

const certificateFileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'application/x-pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid certificate file type. Allowed formats: PDF, JPG, JPEG, PNG.');
    error.statusCode = 400;
    error.code = 'INVALID_CERT_FILE_TYPE';
    cb(error, false);
  }
};

const certificateMulter = multer({
  storage: certificateStorage,
  fileFilter: certificateFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Optional or single certificate upload middleware under field 'file' or 'certificateFile'.
 */
const uploadCertificateFile = (req, res, next) => {
  // Use any() or single() to allow either field 'file' or 'certificateFile'
  const uploader = certificateMulter.fields([
    { name: 'file', maxCount: 1 },
    { name: 'certificateFile', maxCount: 1 },
  ]);

  uploader(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'Certificate file size exceeds maximum allowed limit of 5 MB',
        });
      }
      if (err.code === 'INVALID_CERT_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: 'Invalid certificate file type. Allowed formats: PDF, JPG, JPEG, PNG.',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'Certificate upload error',
      });
    }

    // Attach single file to req.file if uploaded
    if (req.files) {
      if (req.files['file'] && req.files['file'][0]) {
        req.file = req.files['file'][0];
      } else if (req.files['certificateFile'] && req.files['certificateFile'][0]) {
        req.file = req.files['certificateFile'][0];
      }
    }
    next();
  });
};

module.exports = {
  uploadSingleDocument,
  uploadCertificateFile,
  upload: documentMulter,
  CERT_DIR,
};
