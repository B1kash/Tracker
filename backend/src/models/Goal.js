const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    type: { type: String, enum: ['1RM', 'Weight', 'Cardio', 'Custom'], default: '1RM' },
    exerciseName: { type: String }, // Specifically for 1RM goals
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    deadline: { type: String, required: true }, // YYYY-MM-DD
    completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
