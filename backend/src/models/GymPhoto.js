const mongoose = require('mongoose');

const GymPhotoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: {
        type: String, // YYYY-MM-DD format
        required: true
    },
    base64: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('GymPhoto', GymPhotoSchema);
