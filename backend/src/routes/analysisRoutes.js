const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.post('/start', analysisController.triggerAnalysis);
router.get('/:id', analysisController.getAnalysisResult);

module.exports = router;
