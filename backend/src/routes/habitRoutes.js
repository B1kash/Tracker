const express = require('express');
const router = express.Router();
const { getHabits, addHabit, deleteHabit, getAllHabitLogs, getHabitLogByDate, toggleHabitLog } = require('../controllers/habitController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getHabits).post(protect, addHabit);
router.route('/:id').delete(protect, deleteHabit);
router.route('/logs').get(protect, getAllHabitLogs).post(protect, toggleHabitLog);
router.route('/logs/:dateStr').get(protect, getHabitLogByDate);

module.exports = router;
