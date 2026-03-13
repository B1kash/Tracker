const express = require('express');
const router = express.Router();
const { getGamificationData, addXP, checkAndUpdateStreak } = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getGamificationData);
router.route('/xp').post(protect, addXP);
router.route('/streak').post(protect, checkAndUpdateStreak);

module.exports = router;
