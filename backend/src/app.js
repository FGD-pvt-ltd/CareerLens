const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ProfiQ Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
