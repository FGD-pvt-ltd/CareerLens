const express = require('express');
const roadmapController = require('../controllers/roadmapController');
const { validateMongoIdParam } = require('../middleware/validationMiddleware');

const router = express.Router();

// Retrieve Roadmap by Analysis ID
router.get('/:analysisId', validateMongoIdParam('analysisId'), roadmapController.getRoadmap);

module.exports = router;
