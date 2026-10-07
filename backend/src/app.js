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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl) or matching frontendUrl / localhost
      if (!origin || origin === frontendUrl || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true);
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
