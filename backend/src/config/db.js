const dns = require('dns');
const mongoose = require('mongoose');

/**
 * Configure DNS fallback if current system resolver defaults to 127.0.0.1
 * which breaks SRV record queries for mongodb+srv:// on Windows.
 */
function configureDnsFallback() {
  try {
    const servers = dns.getServers();
    if (!servers || servers.length === 0 || (servers.length === 1 && servers[0] === '127.0.0.1')) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
  } catch {
    // Non-critical DNS configuration fallback
  }
}

/**
 * Safely mask credentials in a MongoDB URI for logging.
 */
function maskMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '';
  return uri.replace(/\/\/[^@]+@/, '//[credentials-hidden]@');
}

/**
 * Connect to MongoDB Atlas using Mongoose.
 * 
 * STRICT POLICY:
 * - Uses ONLY the MONGODB_URI configured in backend/.env.
 * - Does NOT fall back to localhost / 127.0.0.1 under any circumstances.
 * - If connection fails, logs safe diagnostics and throws an error so
 *   the application stops cleanly with a non-zero exit code.
 */
const connectDB = async () => {
  // If already connected, return active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    const errorMsg = 'MONGODB_URI is not set in backend/.env. Please configure your MongoDB Atlas connection string.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (uri.includes('+srv')) {
    configureDnsFallback();
  }

  const maskedUri = maskMongoUri(uri);
  console.log(`[Database] Connecting to MongoDB Atlas: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'profiq',
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] Connected successfully to MongoDB Atlas!`);
    console.log(`  - Database: ${conn.connection.name}`);
    console.log(`  - Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB Atlas (${maskedUri}):`);
    console.error(`  - Reason: ${error.message}`);
    throw error;
  }
};

/**
 * Cleanly disconnect Mongoose
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDB, disconnectDB };
