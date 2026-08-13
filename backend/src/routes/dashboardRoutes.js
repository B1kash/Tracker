const express = require('express');
const router = express.Router();
const { getTodayDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.route('/today').get(protect, getTodayDashboard);

module.exports = router;
