const express = require('express');
const router = express.Router();
const { getCardioLogs, addCardioLog, deleteCardioLog } = require('../controllers/cardioController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getCardioLogs).post(protect, addCardioLog);
router.route('/:id').delete(protect, deleteCardioLog);

module.exports = router;
