const express = require('express');
const router = express.Router();
const { getLeaderboard, addFriend, getSquad, createSquad, joinSquad } = require('../controllers/socialController');
const { protect } = require('../middleware/authMiddleware');

router.get('/leaderboard', protect, getLeaderboard);
router.post('/friends', protect, addFriend);
router.get('/squad', protect, getSquad);
router.post('/squad', protect, createSquad);
router.post('/squad/join', protect, joinSquad);

module.exports = router;
