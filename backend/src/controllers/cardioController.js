const CardioLog = require('../models/CardioLog');
const { updateQuestProgress } = require('./gamificationController');

// @route GET /api/cardio?date=YYYY-MM-DD
const getCardioLogs = async (req, res) => {
    try {
        const query = { user: req.user.id };
        if (req.query.date) query.date = req.query.date;
        const logs = await CardioLog.find(query).sort({ createdAt: -1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route POST /api/cardio
const addCardioLog = async (req, res) => {
    try {
        const { date, type, duration, distance, calories, completed } = req.body;
        if (!date || !type) return res.status(400).json({ message: 'date and type required' });
        const log = await CardioLog.create({
            user: req.user.id, date, type, duration, distance, calories,
            completed: completed !== false
        });
        await updateQuestProgress(req.user.id, 'cardio');
        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route DELETE /api/cardio/:id
const deleteCardioLog = async (req, res) => {
    try {
        const log = await CardioLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Not found' });
        if (log.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        await log.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCardioLogs, addCardioLog, deleteCardioLog };
