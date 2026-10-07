const express = require('express');
const profileController = require('../controllers/profileController');
const documentRoutes = require('./documentRoutes');
const githubRoutes = require('./githubRoutes');
const codingProfileRoutes = require('./codingProfileRoutes');
const { uploadCertificateFile } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Mount document routes: /api/profiles/:id/documents
router.use('/:id/documents', documentRoutes);

// Mount GitHub profile integration routes: /api/profiles/:id/github
router.use('/:id/github', githubRoutes);

// Mount Coding platform integration routes: /api/profiles/:id/coding-profiles
router.use('/:id/coding-profiles', codingProfileRoutes);

// GET /api/profiles/:id/unified - Retrieve Complete Unified Candidate Profile
router.get('/:id/unified', profileController.getUnifiedProfile);

// PUT /api/profiles/:id - Update Candidate Profile (structured whitelist)
router.put('/:id', profileController.updateProfile);

// POST /api/profiles/:id/projects - Add a candidate project
router.post('/:id/projects', profileController.addProject);

// POST /api/profiles/:id/experience - Add an experience entry
router.post('/:id/experience', profileController.addExperience);

// POST /api/profiles/:id/certifications - Add a certification (supports PDF/image file upload)
router.post('/:id/certifications', uploadCertificateFile, profileController.addCertification);

// POST /api/profiles/:id/professional-profiles - Add/update professional profile (LinkedIn, etc.)
router.post('/:id/professional-profiles', profileController.addProfessionalProfile);

// POST /api/profiles/:id/portfolios - Add/update portfolio
router.post('/:id/portfolios', profileController.addPortfolio);

// POST /api/profiles/:id/achievements - Add extracurricular/other achievement
router.post('/:id/achievements', profileController.addAchievement);

// POST /api/profiles/:id/academic-achievements - Add academic achievement
router.post('/:id/academic-achievements', profileController.addAcademicAchievement);

// PUT /api/profiles/:id/target-role - Set target role
router.put('/:id/target-role', profileController.setTargetRole);

// POST /api/profiles - Create Candidate Profile
router.post('/', profileController.createProfile);

// GET /api/profiles/:id - Retrieve Candidate Profile by ID
router.get('/:id', profileController.getProfileById);

// POST /api/profiles/:id/analyze - Evaluate Candidate Profile
router.post('/:id/analyze', profileController.analyzeCandidateProfile);

module.exports = router;
