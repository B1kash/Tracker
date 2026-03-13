const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema({
    reps: { type: Number, default: 0 },
    weight: { type: String, default: '' },
    completed: { type: Boolean, default: false }
});

const ExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sets: [SetSchema]
});

const GymWorkoutSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: String, // YYYY-MM-DD format
        required: true
    },
    exercises: [ExerciseSchema]
}, { timestamps: true });

// Usually one workout doc per user per day
GymWorkoutSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('GymWorkout', GymWorkoutSchema);
