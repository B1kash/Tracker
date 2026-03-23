const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, logoutUser, updateDietTargets } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/diet-targets', protect, updateDietTargets);

module.exports = router;
