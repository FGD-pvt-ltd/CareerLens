const mongoose = require('mongoose');
const env = require('./env');

let isDbConnected = false;

// Resilient In-Memory store for offline development / test fallbacks
const inMemoryStore = {
  candidateProfiles: new Map(),
  skills: new Map(),
  evidences: new Map(),
  analyses: new Map(),
  jobRoles: new Map(),
  users: new Map(),
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
    });
    isDbConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isDbConnected = false;
    console.warn(`[Database] Notice: Could not connect to MongoDB (${error.message}).`);
    console.warn(`[Database] Operating in resilient In-Memory development mode. (Provide MONGODB_URI in .env for persistent database).`);
    return null;
  }
};

const isConnected = () => {
  return mongoose.connection.readyState === 1 && isDbConnected;
};

module.exports = {
  connectDB,
  isConnected,
  inMemoryStore,
};
