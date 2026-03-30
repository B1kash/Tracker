const BodyWeight = require('../models/BodyWeight');

// @route GET /api/bodyweight
const getBodyWeightLogs = async (req, res) => {
    try {
        const logs = await BodyWeight.find({ user: req.user.id }).sort({ date: 1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route POST /api/bodyweight
const upsertBodyWeight = async (req, res) => {
    try {
        const { date, weight, chest, waist, hips, bodyFat, arms, thighs, notes } = req.body;
        if (!date || !weight) return res.status(400).json({ message: 'date and weight required' });

        const log = await BodyWeight.findOneAndUpdate(
            { user: req.user.id, date },
            { user: req.user.id, date, weight, chest, waist, hips, bodyFat, arms, thighs, notes },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route DELETE /api/bodyweight/:id
const deleteBodyWeight = async (req, res) => {
    try {
        const log = await BodyWeight.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Not found' });
        if (log.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        await log.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getBodyWeightLogs, upsertBodyWeight, deleteBodyWeight };
