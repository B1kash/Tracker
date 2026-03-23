const mongoose = require('mongoose');

const WorkoutTemplateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: { type: String, required: true, trim: true },
    exercises: [{
        name: { type: String, required: true },
        sets: [{
            reps: { type: Number },
            weight: { type: String }
        }],
        defaultSets: { type: Number, default: 3 },
        defaultReps: { type: Number, default: 10 },
        defaultWeight: { type: String, default: '' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('WorkoutTemplate', WorkoutTemplateSchema);
