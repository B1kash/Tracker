const mongoose = require('mongoose');

const HabitLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: String, // YYYY-MM-DD format
        required: true
    },
    completedHabitIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
    }]
}, { timestamps: true });

// Ensure one log per user per day
HabitLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', HabitLogSchema);
