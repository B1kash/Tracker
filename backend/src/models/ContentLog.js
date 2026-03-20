const mongoose = require('mongoose');

const ContentLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    platform: { type: String, enum: ['YouTube', 'Blog', 'Twitter', 'Instagram', 'LinkedIn', 'TikTok', 'Other'], default: 'Blog' },
    status: { type: String, enum: ['Created', 'Drafted', 'Posted'], default: 'Created' },
    date: { type: String, required: true },
    notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ContentLog', ContentLogSchema);
