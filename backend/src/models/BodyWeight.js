const mongoose = require('mongoose');

const BodyWeightSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: { type: String, required: true },
    weight: { type: Number, required: true },   // kg
    chest: { type: Number },    // cm
    waist: { type: Number },    // cm
    hips: { type: Number },     // cm
    bodyFat: { type: Number },  // % percentage
    arms: { type: Number },     // cm
    thighs: { type: Number },   // cm
    notes: { type: String }
}, { timestamps: true });

// One entry per user per date
BodyWeightSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BodyWeight', BodyWeightSchema);
