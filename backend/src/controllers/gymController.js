const GymWorkout = require('../models/GymWorkout');
const GymPhoto = require('../models/GymPhoto');
const { uploadToS3, deleteFromS3 } = require('../config/s3');
const { updateQuestProgress } = require('./gamificationController');

// @route GET /api/gym/workouts
const getWorkouts = async (req, res) => {
    try {
        const workouts = await GymWorkout.find({ user: req.user.id });
        res.status(200).json(workouts);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// @route POST /api/gym/workouts
const saveWorkout = async (req, res) => {
    try {
        const { dateStr, exercises } = req.body;
        let workout = await GymWorkout.findOne({ user: req.user.id, date: dateStr });
        let isNew = false;
        if (workout) {
            workout.exercises = exercises;
            await workout.save();
        } else {
            workout = await GymWorkout.create({ user: req.user.id, date: dateStr, exercises });
            isNew = true;
        }
        if (isNew) await updateQuestProgress(req.user.id, 'gym');
        res.status(200).json(workout);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// @route GET /api/gym/photos?date=YYYY-MM-DD
const getPhotos = async (req, res) => {
    try {
        const query = { user: req.user.id };
        if (req.query.date) query.date = req.query.date;
        const photos = await GymPhoto.find(query).sort({ createdAt: -1 });
        res.status(200).json(photos);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// @route POST /api/gym/photos  — expects JSON { dateStr, base64, mimetype }
// Limit: 3 photos per user per day
const addPhoto = async (req, res) => {
    try {
        const { dateStr, base64, mimetype = 'image/jpeg' } = req.body;
        if (!dateStr || !base64) return res.status(400).json({ message: 'dateStr and base64 required' });
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(mimetype)) {
            return res.status(400).json({ message: 'Invalid file format. Only JPEG, PNG, WEBP, and HEIC are allowed.' });
        }
        // Enforce 3 photos per day
        const existingCount = await GymPhoto.countDocuments({ user: req.user.id, date: dateStr });
        if (existingCount >= 3) {
            return res.status(400).json({ message: 'Maximum 3 photos allowed per day' });
        }

        // Convert base64 to buffer and upload to S3
        const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const url = await uploadToS3(buffer, mimetype, 'gym-photos');

        const photo = await GymPhoto.create({ user: req.user.id, date: dateStr, url });
        res.status(201).json(photo);
    } catch (e) {
        console.error('Photo upload error:', e);
        res.status(500).json({ message: 'Upload failed: ' + e.message });
    }
};

// @route DELETE /api/gym/photos/:id
const deletePhoto = async (req, res) => {
    try {
        const photo = await GymPhoto.findById(req.params.id);
        if (!photo) return res.status(404).json({ message: 'Photo not found' });
        if (photo.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        
        // Delete from S3 if URL exists
        if (photo.url) await deleteFromS3(photo.url);
        
        await photo.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

module.exports = { getWorkouts, saveWorkout, getPhotos, addPhoto, deletePhoto };
