const mongoose = require('mongoose');

const ProgressLogSchema = new mongoose.Schema({
    whatLearned: { type: String, required: true },
    doubts: { type: String },
    keyTakeaways: { type: String },
    timeSpent: { type: String },
    mood: { type: String, enum: ['great', 'good', 'okay', 'struggling'], default: 'good' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
}, { timestamps: true });

const LearningGoalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    resource: { type: String },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    progressLogs: [ProgressLogSchema],
}, { timestamps: true });

module.exports = mongoose.model('LearningGoal', LearningGoalSchema);
