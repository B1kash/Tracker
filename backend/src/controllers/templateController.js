const WorkoutTemplate = require('../models/WorkoutTemplate');

// @route GET /api/templates
const getTemplates = async (req, res) => {
    try {
        const templates = await WorkoutTemplate.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route POST /api/templates
const createTemplate = async (req, res) => {
    try {
        const { name, exercises } = req.body;
        if (!name || !exercises?.length) return res.status(400).json({ message: 'name and exercises required' });
        const template = await WorkoutTemplate.create({ user: req.user.id, name, exercises });
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const template = await WorkoutTemplate.findOne({ _id: req.params.id, user: req.user.id });
        if (!template) {
             return res.status(404).json({ message: 'Template not found or unauthorized' });
        }
        await WorkoutTemplate.findByIdAndDelete(req.params.id);
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        console.error("Delete template error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getTemplates, createTemplate, deleteTemplate };
