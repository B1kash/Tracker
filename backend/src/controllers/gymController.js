const GymWorkout = require('../models/GymWorkout');
const GymPhoto = require('../models/GymPhoto');
const { updateQuestProgress } = require('./gamificationController');

// @desc    Get gym workouts
// @route   GET /api/gym/workouts
// @access  Private
const getWorkouts = async (req, res) => {
    try {
        const workouts = await GymWorkout.find({ user: req.user.id });
        res.status(200).json(workouts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Save workout for date
// @route   POST /api/gym/workouts
// @access  Private
const saveWorkout = async (req, res) => {
    try {
        const { dateStr, exercises } = req.body;

        let workout = await GymWorkout.findOne({ user: req.user.id, date: dateStr });
        let isNew = false;

        if (workout) {
            workout.exercises = exercises;
            await workout.save();
        } else {
            workout = await GymWorkout.create({
                user: req.user.id,
                date: dateStr,
                exercises
            });
            isNew = true;
        }

        if (isNew) {
            await updateQuestProgress(req.user.id, 'gym');
        }

        res.status(200).json(workout);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get gym photos
// @route   GET /api/gym/photos
// @access  Private
const getPhotos = async (req, res) => {
    try {
        const photos = await GymPhoto.find({ user: req.user.id });
        res.status(200).json(photos);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add gym photo
// @route   POST /api/gym/photos
// @access  Private
const addPhoto = async (req, res) => {
    try {
        const { dateStr, base64 } = req.body;
        const photo = await GymPhoto.create({
            user: req.user.id,
            date: dateStr,
            base64
        });
        res.status(201).json(photo);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete gym photo
// @route   DELETE /api/gym/photos/:id
// @access  Private
const deletePhoto = async (req, res) => {
    try {
        const photo = await GymPhoto.findById(req.params.id);
        if (!photo) return res.status(404).json({ message: 'Photo not found' });
        if (photo.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await photo.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getWorkouts, saveWorkout, getPhotos, addPhoto, deletePhoto };
