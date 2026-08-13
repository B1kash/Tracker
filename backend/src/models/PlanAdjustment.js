const mongoose = require('mongoose');

const PlanAdjustmentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    plan: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'AIPlan' },
    category: { type: String, enum: ['workout', 'nutrition', 'habit', 'recovery', 'goal'], required: true },
    reason: { type: String, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    proposedValue: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: String },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('PlanAdjustment', PlanAdjustmentSchema);
