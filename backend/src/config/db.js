const mongoose = require('mongoose');

let mongoMemoryServer = null;

/**
 * Connect to MongoDB using Mongoose.
 * Attempts primary process.env.MONGODB_URI first.
 * If local/remote MongoDB daemon is not running or unreachable (e.g. port blocked / ECONNREFUSED),
 * automatically spins up an embedded MongoMemoryServer instance so backend and database
 * operations always succeed seamlessly without manual database installation.
 */
const connectDB = async () => {
  // If already connected, return active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const primaryUri = process.env.MONGODB_URI;

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[Database] MongoDB Connected successfully to database: ${conn.connection.name} (${primaryUri})`);
      return conn;
    } catch (primaryError) {
      console.warn(`[Database Warning] Primary MongoDB URI (${primaryUri}) not reachable: ${primaryError.message}`);
      console.log('[Database] Activating resilient embedded MongoDB engine (mongodb-memory-server)...');
    }
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!mongoMemoryServer) {
      try {
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'profiq',
          },
        });
      } catch {
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'profiq',
          },
        });
      }
    }
    const memoryUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memoryUri, {
      dbName: 'profiq',
    });
    console.log(`[Database] Resilient Embedded MongoDB connected successfully at ${memoryUri} (db: profiq)`);
    return conn;
  } catch (embeddedError) {
    console.error(`[Database Error] Failed to initialize embedded MongoDB: ${embeddedError.message}`);
    throw embeddedError;
  }
};

/**
 * Cleanly disconnect Mongoose and shut down embedded Mongo engine if running
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
};

module.exports = { connectDB, disconnectDB };
