const express = require('express');
const analysisController = require('../controllers/analysisController');
const {
  validateAnalysisBody,
  validateMongoIdParam,
} = require('../middleware/validationMiddleware');

const router = express.Router();

// Initialize Candidate Profile Analysis
router.post('/', validateAnalysisBody, analysisController.startAnalysis);

// Retrieve Analysis Report by ID
router.get('/:id', validateMongoIdParam('id'), analysisController.getAnalysis);

module.exports = router;
