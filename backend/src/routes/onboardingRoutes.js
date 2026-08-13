const express = require('express');
const router = express.Router();
const { submitOnboarding } = require('../controllers/onboardingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitOnboarding);

module.exports = router;
