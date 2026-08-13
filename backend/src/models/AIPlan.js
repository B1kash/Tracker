const mongoose = require('mongoose');

const HabitPlanSchema = new mongoose.Schema({
    name: { type: String },
    frequency: { type: String },
    target: { type: String }
});

const AIPlanSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
    isActive: { type: Boolean, default: true },
    workoutPlan: {
        weeklySchedule: { type: String }, // e.g., "4 days a week"
        workouts: [{
            dayName: { type: String },
            estimatedDuration: { type: String },
            exercises: [{
                name: { type: String },
                sets: { type: Number },
                reps: { type: String }, // e.g., "8-10" or "Failure"
                restTime: { type: String }
            }]
        }],
        progressionStrategy: { type: String },
        equipmentAlternatives: { type: String }
    },
    nutritionPlan: {
        dailyCalories: { type: Number },
        proteinTarget: { type: Number },
        carbsTarget: { type: Number },
        fatsTarget: { type: Number },
        mealStructure: { type: String },
        foodSuggestions: [{ type: String }],
        hydrationGuidance: { type: String }
    },
    habitPlan: [HabitPlanSchema],
    recoveryPlan: {
        restDays: { type: String },
        sleepTarget: { type: String },
        mobilitySuggestions: { type: String }
    },
    explanation: { type: String } // Why this plan?
}, { timestamps: true });

module.exports = mongoose.model('AIPlan', AIPlanSchema);
