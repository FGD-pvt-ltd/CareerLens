/**
 * Centralized Application Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid profile ID';
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.length > 0 ? errors[0] : 'Validation error';
  }

  // Malformed JSON syntax error in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body in request';
  }

  // MongoDB connection / server error
  if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    statusCode = 500;
    message = 'Database connection error';
  }

  // Multer & File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size exceeds maximum allowed limit of 5 MB';
  } else if (err.code === 'INVALID_FILE_TYPE') {
    statusCode = 400;
    message = err.message || 'Invalid file type. Only PDF documents are allowed.';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message || 'File upload error';
  }

  // Log error on server console without leaking to client
  console.error(`[Error] [${req.method} ${req.url}] ${statusCode} - ${message}`);

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
