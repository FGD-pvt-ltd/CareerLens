const express = require('express');
const analysisController = require('../controllers/analysisController');

const router = express.Router();

// Initialize Candidate Profile Analysis: POST /api/analysis
router.post('/', analysisController.startAnalysis);

// Retrieve Analysis Report by ID: GET /api/analysis/:id
router.get('/:id', analysisController.getAnalysisById);

module.exports = router;
