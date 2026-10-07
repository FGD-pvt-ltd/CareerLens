const path = require('path');
const dotenv = require('dotenv');

// Load .env file from backend root, fallback to current working directory .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/profiq',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  AI_SERVICE_TIMEOUT_MS: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 15000,
  MOCK_AI_SERVICE: process.env.MOCK_AI_SERVICE === 'true',
};

/**
 * Validate required startup environment variables.
 * Safe diagnostics without leaking secret credentials to console.
 */
function validateEnv() {
  const errors = [];

  // 1. Port validation
  if (isNaN(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
    errors.push(`Invalid PORT configured: '${process.env.PORT}'. Must be an integer between 1 and 65535.`);
  }

  // 2. Production Database Requirement
  if (env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
    errors.push('MONGODB_URI is required when running in production environment.');
  }

  // 3. Frontend URL
  if (!env.FRONTEND_URL) {
    errors.push('FRONTEND_URL must be defined for CORS policy configuration.');
  }

  if (errors.length > 0) {
    const errorMsg = `[Config Error] Environment validation failed:\n  - ${errors.join('\n  - ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Diagnostic summary with secrets safely masked
  const maskedGithub = env.GITHUB_TOKEN ? `configured (length: ${env.GITHUB_TOKEN.length})` : 'not configured (unauthenticated rate limit)';
  const maskedAiService = env.AI_SERVICE_URL ? env.AI_SERVICE_URL : 'not configured';
  const mongoSource = env.MONGODB_URI.includes('@') ? 'mongodb://[credentials-hidden]@...' : env.MONGODB_URI;

  console.log('[Config] Environment validation passed:');
  console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  - PORT: ${env.PORT}`);
  console.log(`  - MONGODB_URI: ${mongoSource || 'default fallback'}`);
  console.log(`  - FRONTEND_URL: ${env.FRONTEND_URL}`);
  console.log(`  - GITHUB_TOKEN: ${maskedGithub}`);
  console.log(`  - AI_SERVICE_URL: ${maskedAiService}`);
  console.log(`  - MOCK_AI_SERVICE: ${env.MOCK_AI_SERVICE}`);

  return true;
}

module.exports = {
  ...env,
  validateEnv,
};

