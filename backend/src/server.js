const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { seedJobRoles } = require('./services/roleService');

async function startServer() {
  // Connect to Database (graceful with in-memory fallback)
  await connectDB();

  // Seed standard industry role benchmarks
  await seedJobRoles();

  const server = app.listen(env.PORT, () => {
    console.log(`==============================================`);
    console.log(` ProfiQ Backend Server running on port ${env.PORT}`);
    console.log(` Environment: ${env.NODE_ENV}`);
    console.log(` Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`==============================================`);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed.');
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

startServer();
