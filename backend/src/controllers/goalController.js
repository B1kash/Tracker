const Goal = require('../models/Goal');

// @route GET /api/goals
const getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ user: req.user.id }).sort({ deadline: 1 });
        res.status(200).json(goals);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route POST /api/goals
const addGoal = async (req, res) => {
    try {
        const { title, type, exerciseName, targetValue, deadline } = req.body;
        if (!title || !targetValue || !deadline) return res.status(400).json({ message: 'Missing required fields' });
        
        const goal = await Goal.create({
            user: req.user.id, title, type, exerciseName, targetValue, deadline
        });
        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route PUT /api/goals/:id
const updateGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        
        const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedGoal);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route DELETE /api/goals/:id
const deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);
        if (!goal) return res.status(404).json({ message: 'Not found' });
        if (goal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        
        await goal.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getGoals, addGoal, updateGoal, deleteGoal };
