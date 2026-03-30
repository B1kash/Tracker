const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getMe, logoutUser, updateDietTargets, togglePrivacy } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Strict limiting for credential endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    message: { message: 'Too many authentication attempts, please try again after 15 minutes' }
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', googleLogin);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/diet-targets', protect, updateDietTargets);
router.put('/privacy', protect, togglePrivacy);

module.exports = router;
