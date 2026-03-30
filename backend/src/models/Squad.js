const mongoose = require('mongoose');

const SquadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    currentQuest: {
        title: { type: String, default: 'The Squad Initiative' },
        target: { type: Number, default: 15 }, // E.g., Combined 15 gym visits
        current: { type: Number, default: 0 },
        xpReward: { type: Number, default: 500 },
        completed: { type: Boolean, default: false },
        deadline: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('Squad', SquadSchema);
