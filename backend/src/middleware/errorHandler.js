const multer = require('multer');

/**
 * Centralized Application Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected internal server error occurred.';

  // Multer Upload Errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size limit of 5MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected upload field: '${err.field}'. Expected form-data field 'resume'.`;
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // Custom File Type Error
  if (err.code === 'INVALID_FILE_TYPE') {
    statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = `Validation failed: ${errors.join(', ')}`;
  }

  // Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': value '${err.value}' is not valid.`;
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate resource: A record with that ${field} already exists.`;
  }

  // JSON Body Parse Error (e.g. syntax error in raw body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body in request.';
  }

  // Log error details for server diagnostics (without leaking in responses)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] [${req.method} ${req.url}] ${statusCode} - ${message}`);
    if (statusCode === 500) {
      console.error(err.stack);
    }
  }

  // Consistent Error Response Output
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
