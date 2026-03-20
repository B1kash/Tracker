const express = require('express');
const router = express.Router();
const { getLogs, addLog, updateLog, deleteLog } = require('../controllers/contentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getLogs).post(protect, addLog);
router.route('/:id').put(protect, updateLog).delete(protect, deleteLog);

module.exports = router;
