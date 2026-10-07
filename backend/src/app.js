const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route Modules
const profileRoutes = require('./routes/profileRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const aiRoutes = require('./routes/aiRoutes');
const jobRoleRoutes = require('./routes/jobRoleRoutes');

const app = express();

// CORS Configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const isProduction = process.env.NODE_ENV === 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl)
      if (!origin) return callback(null, true);
      if (origin === frontendUrl || (!isProduction && origin.startsWith('http://localhost:'))) {
        return callback(null, true);
      }
      if (!isProduction) {
        return callback(null, true);
      }
      return callback(new Error('Origin blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'ProfiQ backend is running',
    data: {
      status: 'healthy',
      service: 'profiq-backend',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

// Route Registration
app.use('/api/profiles', profileRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/roles', jobRoleRoutes);

// 404 Catch-All
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
