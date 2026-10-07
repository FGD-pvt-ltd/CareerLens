const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController');

router.get('/:analysisId', roadmapController.getRoadmap);
router.patch('/milestone/:milestoneId', roadmapController.updateMilestoneStatus);

module.exports = router;
