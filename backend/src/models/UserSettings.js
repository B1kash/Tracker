const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    habitReminderTime: { type: String, default: '08:00' }, // HH:mm format
    pushSubscriptions: [{
        endpoint: { type: String, required: true },
        keys: {
            auth: { type: String, required: true },
            p256dh: { type: String, required: true }
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
