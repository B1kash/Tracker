const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    description: { type: String },
    type: { 
        type: String, 
        enum: ['Weight Loss', 'Muscle Building', 'Weight Gain', 'Recomposition', 'Fitness', 'Strength', 'Endurance', 'Habits', 'Maintenance', 'Custom', '1RM', 'Weight', 'Cardio'], 
        required: true 
    },
    isPrimary: { type: Boolean, default: false },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    targetDate: { type: String, required: true }, // YYYY-MM-DD
    startingValue: { type: Number },
    targetValue: { type: Number },
    currentValue: { type: Number },
    unit: { type: String },
    status: { type: String, enum: ['Active', 'Completed', 'Abandoned', 'On Hold'], default: 'Active' },
    progressPercentage: { type: Number, default: 0 },
    exerciseName: { type: String } // For 1RM legacy support
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
