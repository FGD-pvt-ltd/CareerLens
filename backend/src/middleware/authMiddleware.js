/**
 * Authentication Middleware
 * Validates JWT tokens on protected routes
 */

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  // Token verification placeholder
  req.user = { id: 'mock-user-id' };
  next();
}

module.exports = {
  authenticate,
};
