const mongoose = require('mongoose');

const DietLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: String,
        required: true
    },
    meal: { type: String, required: true },
    food: { type: String, required: true },
    calories: { type: String },
    protein: { type: String },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DietLog', DietLogSchema);
