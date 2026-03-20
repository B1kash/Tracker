const DietLog = require('../models/DietLog');
const { updateQuestProgress } = require('./gamificationController');

// @route GET /api/diet?date=YYYY-MM-DD
const getDietLogs = async (req, res) => {
    try {
        const query = { user: req.user.id };
        if (req.query.date) query.date = req.query.date;
        const logs = await DietLog.find(query).sort({ createdAt: 1 });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route POST /api/diet
const addDietLog = async (req, res) => {
    try {
        const { date, meal, food, calories, protein, carbs, fats, notes } = req.body;
        if (!date || !meal || !food) return res.status(400).json({ message: 'date, meal and food required' });
        const log = await DietLog.create({
            user: req.user.id, date, meal, food, calories, protein, carbs, fats, notes
        });
        await updateQuestProgress(req.user.id, 'diet');
        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route DELETE /api/diet/:id
const deleteDietLog = async (req, res) => {
    try {
        const log = await DietLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Not found' });
        if (log.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        await log.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getDietLogs, addDietLog, deleteDietLog };
