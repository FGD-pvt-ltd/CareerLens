const express = require('express');
const codingProfileController = require('../controllers/codingProfileController');

// mergeParams: true enables access to :id from parent router (/api/profiles/:id/coding-profiles)
const router = express.Router({ mergeParams: true });

// POST /api/profiles/:id/coding-profiles - Add or update a coding profile
router.post('/', codingProfileController.addCodingProfile);

// GET /api/profiles/:id/coding-profiles - Get all coding profiles for candidate
router.get('/', codingProfileController.getCodingProfiles);

// PUT /api/profiles/:id/coding-profiles/:platform - Refresh coding profile data
router.put('/:platform', codingProfileController.refreshCodingProfile);

// DELETE /api/profiles/:id/coding-profiles/:platform - Remove a coding profile
router.delete('/:platform', codingProfileController.deleteCodingProfile);

module.exports = router;
