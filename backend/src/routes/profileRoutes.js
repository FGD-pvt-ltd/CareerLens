const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/upload-resume', profileController.uploadResume);

module.exports = router;
