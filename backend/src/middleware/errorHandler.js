/**
 * Central Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${err.message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
