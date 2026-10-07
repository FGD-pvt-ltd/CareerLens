const path = require('path');
const dotenv = require('dotenv');

// Load .env file from backend root, fallback to current working directory .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  AI_SERVICE_TIMEOUT_MS: parseInt(process.env.AI_SERVICE_TIMEOUT_MS, 10) || 15000,
  MOCK_AI_SERVICE: process.env.MOCK_AI_SERVICE === 'true',
};

module.exports = env;
