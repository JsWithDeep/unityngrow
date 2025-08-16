const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

// GET /api/team/my-team
router.get('/my-team', teamController.getMyTeam);

module.exports = router;
