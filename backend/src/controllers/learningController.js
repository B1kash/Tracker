const LearningGoal = require('../models/LearningGoal');

// GET /api/learning
const getGoals = async (req, res) => {
    try {
        const goals = await LearningGoal.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(goals);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// POST /api/learning
const addGoal = async (req, res) => {
    try {
        const { title, resource, progress, status } = req.body;
        if (!title) return res.status(400).json({ message: 'Title required' });
        const goal = await LearningGoal.create({ user: req.user.id, title, resource, progress: progress || 0, status: status || 'Not Started' });
        res.status(201).json(goal);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// PUT /api/learning/:id
const updateGoal = async (req, res) => {
    try {
        const goal = await LearningGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        const updated = await LearningGoal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updated);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// DELETE /api/learning/:id
const deleteGoal = async (req, res) => {
    try {
        const goal = await LearningGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        await goal.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// POST /api/learning/:id/log  — add a daily progress log entry
const addLog = async (req, res) => {
    try {
        const goal = await LearningGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { whatLearned, doubts, keyTakeaways, timeSpent, mood, progress } = req.body;
        if (!whatLearned) return res.status(400).json({ message: 'whatLearned required' });

        goal.progressLogs.push({ whatLearned, doubts, keyTakeaways, timeSpent, mood: mood || 'good' });
        if (progress !== undefined) goal.progress = Math.min(100, Math.max(0, Number(progress)));
        if (progress >= 100) goal.status = 'Completed';
        else if (goal.progressLogs.length > 0) goal.status = 'In Progress';

        await goal.save();
        res.status(201).json(goal);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// DELETE /api/learning/:id/log/:logId
const deleteLog = async (req, res) => {
    try {
        const goal = await LearningGoal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        goal.progressLogs = goal.progressLogs.filter(l => l._id.toString() !== req.params.logId);
        await goal.save();
        res.status(200).json(goal);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

module.exports = { getGoals, addGoal, updateGoal, deleteGoal, addLog, deleteLog };
