const ContentLog = require('../models/ContentLog');

// GET /api/content
const getLogs = async (req, res) => {
    try {
        const query = { user: req.user.id };
        if (req.query.date) query.date = req.query.date;
        const logs = await ContentLog.find(query).sort({ date: -1, createdAt: -1 });
        res.status(200).json(logs);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// POST /api/content
const addLog = async (req, res) => {
    try {
        const { title, platform, status, date, notes } = req.body;
        if (!title || !date) return res.status(400).json({ message: 'title and date required' });
        const log = await ContentLog.create({ user: req.user.id, title, platform: platform || 'Blog', status: status || 'Created', date, notes });
        res.status(201).json(log);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// PUT /api/content/:id
const updateLog = async (req, res) => {
    try {
        const log = await ContentLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Not found' });
        if (log.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        const updated = await ContentLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updated);
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

// DELETE /api/content/:id
const deleteLog = async (req, res) => {
    try {
        const log = await ContentLog.findById(req.params.id);
        if (!log) return res.status(404).json({ message: 'Not found' });
        if (log.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        await log.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (e) { res.status(500).json({ message: 'Server error' }); }
};

module.exports = { getLogs, addLog, updateLog, deleteLog };
