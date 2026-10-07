const express = require('express');
const analysisController = require('../controllers/analysisController');

const router = express.Router();

// GET /api/ai/health - Health check endpoint verifying Python/FastAPI AI service connectivity
router.get('/health', analysisController.getAiHealth);

module.exports = router;
