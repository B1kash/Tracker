const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getMe, logoutUser, updateDietTargets, togglePrivacy } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/diet-targets', protect, updateDietTargets);
router.put('/privacy', protect, togglePrivacy);

module.exports = router;
