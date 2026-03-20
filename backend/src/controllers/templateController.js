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

// @route DELETE /api/templates/:id
const deleteTemplate = async (req, res) => {
    try {
        const template = await WorkoutTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Not found' });
        if (template.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        await template.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getTemplates, createTemplate, deleteTemplate };
