const express = require('express');
const githubController = require('../controllers/githubController');

// mergeParams: true allows accessing :id from parent router (/api/profiles/:id/github)
const router = express.Router({ mergeParams: true });

// POST /api/profiles/:id/github - Analyze and ingest candidate GitHub profile
router.post('/', githubController.analyzeGithubProfile);

module.exports = router;
