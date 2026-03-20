const express = require('express');
const router = express.Router();
const { getPublicKey, subscribe, getSettings, updateSettings } = require('../controllers/pushController');
const { protect } = require('../middleware/authMiddleware');

router.get('/public-key', getPublicKey);
router.route('/subscribe').post(protect, subscribe);
router.route('/settings').get(protect, getSettings).put(protect, updateSettings);

module.exports = router;
