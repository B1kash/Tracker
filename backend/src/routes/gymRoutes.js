const express = require('express');
const router = express.Router();
const { getWorkouts, saveWorkout, getPhotos, addPhoto, deletePhoto } = require('../controllers/gymController');
const { protect } = require('../middleware/authMiddleware');

router.route('/workouts').get(protect, getWorkouts).post(protect, saveWorkout);
router.route('/photos').get(protect, getPhotos).post(protect, addPhoto);
router.route('/photos/:id').delete(protect, deletePhoto);

module.exports = router;
