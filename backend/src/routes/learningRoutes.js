const express = require('express');
const router = express.Router();
const { getGoals, addGoal, updateGoal, deleteGoal, addLog, deleteLog } = require('../controllers/learningController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getGoals).post(protect, addGoal);
router.route('/:id').put(protect, updateGoal).delete(protect, deleteGoal);
router.route('/:id/log').post(protect, addLog);
router.route('/:id/log/:logId').delete(protect, deleteLog);

module.exports = router;
