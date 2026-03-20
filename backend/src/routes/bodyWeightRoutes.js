const express = require('express');
const router = express.Router();
const { getBodyWeightLogs, upsertBodyWeight, deleteBodyWeight } = require('../controllers/bodyWeightController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getBodyWeightLogs).post(protect, upsertBodyWeight);
router.route('/:id').delete(protect, deleteBodyWeight);

module.exports = router;
