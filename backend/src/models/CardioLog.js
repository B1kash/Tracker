const mongoose = require('mongoose');

const CardioLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: String,
        required: true
    },
    type: { type: String, required: true },
    duration: { type: String },
    distance: { type: String },
    calories: { type: String },
    completed: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('CardioLog', CardioLogSchema);
