const express = require('express');
const router = express.Router();
const { getGamificationData, addXP, checkAndUpdateStreak, updateGamificationSettings } = require('../controllers/gamificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getGamificationData);
router.route('/xp').post(protect, addXP);
router.route('/streak').post(protect, checkAndUpdateStreak);
router.route('/settings').put(protect, updateGamificationSettings);

module.exports = router;
