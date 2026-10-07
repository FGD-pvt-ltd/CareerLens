const express = require('express');
const githubController = require('../controllers/githubController');
const { validateGithubBody } = require('../middleware/validationMiddleware');

const router = express.Router();

// Analyze GitHub user profile and repositories
router.post('/analyze', validateGithubBody, githubController.analyzeGithub);

module.exports = router;
