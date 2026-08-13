const User = require('../models/User');
const Goal = require('../models/Goal');
const GymWorkout = require('../models/GymWorkout');
const DietLog = require('../models/DietLog');

/**
 * Builds the AI context depending on the purpose.
 * Prevents sending the entire database to the LLM.
 * 
 * @param {String} userId 
 * @param {String} purpose 'workout', 'nutrition', 'coach', 'weekly-review', 'initial-plan'
 */
const buildAIContext = async (userId, purpose) => {
    const user = await User.findById(userId).lean();
    if (!user) throw new Error("User not found");

    const activeGoal = await Goal.findOne({ user: userId, status: 'Active', isPrimary: true }).lean();

    let context = {
        userProfile: user.profile,
        activeGoal: activeGoal
    };

    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

    switch (purpose) {
        case 'initial-plan':
            // Just profile and goal is enough
            break;
            
        case 'workout':
            // Last 10 workouts
            context.recentWorkouts = await GymWorkout.find({ user: userId })
                .sort({ date: -1 })
                .limit(10)
                .lean();
            break;

        case 'nutrition':
            // Recent diet logs and weight trend
            context.recentDiet = await DietLog.find({ user: userId })
                .sort({ date: -1 })
                .limit(14) // last 14 meals roughly
                .lean();
            break;

        case 'weekly-review':
        case 'coach':
            // Need a holistic but summarized view
            context.recentWorkouts = await GymWorkout.find({ user: userId, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }).lean();
            context.recentDiet = await DietLog.find({ user: userId, date: { $gte: thirtyDaysAgo } }).sort({ date: 1 }).lean();
            break;
    }

    return context;
};

module.exports = {
    buildAIContext
};
