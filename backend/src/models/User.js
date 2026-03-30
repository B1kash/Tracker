const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: false,
        minlength: [6, 'Password must be at least 6 characters']
    },
    gamification: {
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        currentStreak: { type: Number, default: 0 },
        bestStreak: { type: Number, default: 0 },
        lastActiveDate: { type: Date, default: null },
        lastQuestReset: { type: Date, default: null },
        weeklyTrainDays: { type: Number, default: 5 }, // Added for custom streak logic
        restDaysAvailable: { type: Number, default: 2 }, // Replenishes weekly (7 - weeklyTrainDays)
        quests: [{
            title: String,
            target: Number,
            current: { type: Number, default: 0 },
            xpReward: Number,
            completed: { type: Boolean, default: false },
            type: { type: String, enum: ['gym', 'cardio', 'diet', 'habits'] }
        }]
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    squad: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad', default: null },
    isPrivate: { type: Boolean, default: false },
    dietTargets: {
        calories: { type: Number, default: 2000 },
        protein: { type: Number, default: 150 },
        carbs: { type: Number, default: 200 },
        fats: { type: Number, default: 70 }
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
