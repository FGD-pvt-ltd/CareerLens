/**
 * Standardized API Response Utilities
 */

function successResponse(res, data, statusCode = 200, message = null) {
  const payload = {
    success: true,
    data,
  };
  if (message) {
    payload.message = message;
  }
  return res.status(statusCode).json(payload);
}

function errorResponse(res, error, statusCode = 500) {
  const message = typeof error === 'string' ? error : (error.message || 'An error occurred');
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = {
  successResponse,
  errorResponse,
};
