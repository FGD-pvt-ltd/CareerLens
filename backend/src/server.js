const path = require('path');
const dotenv = require('dotenv');

// 1. Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { validateEnv } = require('./config/env');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { seedJobRoles } = require('./services/roleService');

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function startServer() {
  try {
    // 2. Validate configuration variables
    validateEnv();

    // 3. Connect to MongoDB (with automatic fallback to embedded engine if daemon unavailable)
    await connectDB();
    await seedJobRoles();

    // 3. Start Express server only after database connection succeeds
    const server = app.listen(PORT, () => {
      console.log(`[Server] ProfiQ Backend Server running on port ${PORT}`);
      console.log(`[Server] Health Check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async () => {
      console.log('[Server] Gracefully shutting down ProfiQ server...');
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Disconnected and shutdown complete.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`[Server Error] Unable to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();
