const express = require('express');
const router = express.Router();
const { getDietLogs, addDietLog, deleteDietLog } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getDietLogs).post(protect, addDietLog);
router.route('/:id').delete(protect, deleteDietLog);

module.exports = router;
