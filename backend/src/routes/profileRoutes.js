const express = require('express');
const profileController = require('../controllers/profileController');
const upload = require('../middleware/uploadMiddleware');
const {
  validateMongoIdParam,
  validateProfileBody,
} = require('../middleware/validationMiddleware');

const router = express.Router();

// Candidate Profile CRUD
router.post('/', validateProfileBody, profileController.createProfile);
router.get('/:id', validateMongoIdParam('id'), profileController.getProfile);
router.put('/:id', validateMongoIdParam('id'), validateProfileBody, profileController.updateProfile);
router.delete('/:id', validateMongoIdParam('id'), profileController.deleteProfile);

// Resume Upload & Text Extraction
router.post(
  '/:id/resume',
  validateMongoIdParam('id'),
  upload.single('resume'),
  profileController.uploadResume
);

module.exports = router;
