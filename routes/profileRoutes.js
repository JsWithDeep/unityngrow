const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// GET profile
router.get('/', profileController.getProfile);

// PUT update profile
router.put('/update', profileController.updateProfile);

module.exports = router;
