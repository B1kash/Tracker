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
    name: { type: String, trim: true },
    profilePic: { type: String, default: '' },
    height: { type: Number }, // in cm
    targetWeight: { type: Number }, // in kg
    targetBmi: { type: Number },
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
    },
    profile: {
        age: { type: Number },
        gender: { type: String },
        unitPreference: { type: String, enum: ['kg/cm', 'lb/ft'], default: 'kg/cm' },
        country: { type: String },
        activityLevel: { type: String, enum: ['Sedentary', 'Lightly active', 'Moderately active', 'Very active'] },
        fitnessExperience: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
        trainingDaysPerWeek: { type: Number },
        preferredWorkoutDuration: { type: String },
        workoutLocation: { type: String, enum: ['Gym', 'Home', 'Both'] },
        equipment: [{ type: String }],
        trainingPreferences: {
            preferredStyle: { type: String },
            exercisesEnjoyed: [{ type: String }],
            exercisesDisliked: [{ type: String }],
            muscleGroupsPriority: [{ type: String }],
            cardioPreference: { type: String }
        },
        nutritionPreferences: {
            dietaryPreference: { type: String },
            allergies: [{ type: String }],
            foodsAvoided: [{ type: String }],
            favoriteFoods: [{ type: String }],
            mealsPerDay: { type: Number },
            cookingPreference: { type: String },
            budget: { type: String }
        },
        lifestyle: {
            dailySteps: { type: Number },
            sleepDuration: { type: String },
            stressLevel: { type: String },
            sittingTime: { type: String }
        },
        limitations: [{ type: String }],
        onboardingCompleted: { type: Boolean, default: false },
        onboardingVersion: { type: String, default: '1.0' },
        profileUpdatedAt: { type: Date }
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
