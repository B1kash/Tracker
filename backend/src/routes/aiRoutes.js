const express = require('express');
const router = express.Router();
const { getCoachAdvice, getRoast, analyzeDiet, generateWorkoutTemplate, generateCurriculum, getDailyBrief, getSupplementAdvice, generateDietPlan, generateDailyRoutine } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.route('/coach').get(protect, getCoachAdvice);
router.route('/roast').get(protect, getRoast);
router.route('/diet').post(protect, analyzeDiet);
router.route('/workout-template').post(protect, generateWorkoutTemplate);
router.route('/curriculum').post(protect, generateCurriculum);
router.route('/brief').get(protect, getDailyBrief);
router.route('/supplements').get(protect, getSupplementAdvice);
router.route('/diet-plan').post(protect, generateDietPlan);
router.route('/daily-routine').post(protect, generateDailyRoutine);

module.exports = router;
