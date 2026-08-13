const User = require('../models/User');
const Goal = require('../models/Goal');
const GymWorkout = require('../models/GymWorkout');
const DietLog = require('../models/DietLog');
const Habit = require('../models/Habit');
const AIPlan = require('../models/AIPlan');

// @desc    Get Today Dashboard Data
// @route   GET /api/dashboard/today
// @access  Private
const getTodayDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const todayDate = new Date().toISOString().split('T')[0];

        const user = await User.findById(userId).lean();
        
        // 1. Goal Progress
        const activeGoal = await Goal.findOne({ user: userId, status: 'Active', isPrimary: true }).lean();
        
        // 2. Active AI Plan
        const activePlan = await AIPlan.findOne({ user: userId, isActive: true }).lean();
        
        // 3. Today's Workout
        let todayWorkout = await GymWorkout.findOne({ user: userId, date: todayDate }).lean();
        if (!todayWorkout && activePlan) {
            // Check if today is a scheduled workout day (Simplified logic for now)
            const dayOfWeek = new Date().getDay();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayName = days[dayOfWeek];
            
            const scheduledWorkout = activePlan.workoutPlan?.workouts?.find(w => w.dayName === todayName);
            if (scheduledWorkout) {
                todayWorkout = {
                    isScheduled: true,
                    name: scheduledWorkout.name || `${todayName} Workout`,
                    exercises: scheduledWorkout.exercises.map(ex => ({
                        name: ex.name,
                        sets: Array(ex.sets || 3).fill({ reps: ex.reps, weight: '', completed: false })
                    }))
                };
            }
        }

        // 4. Nutrition Summary
        const dietLogs = await DietLog.find({ user: userId, date: todayDate }).lean();
        let nutrition = {
            calories: 0, protein: 0, carbs: 0, fats: 0,
            targets: activePlan?.nutritionPlan || user.dietTargets
        };
        
        dietLogs.forEach(log => {
            nutrition.calories += Number(log.calories) || 0;
            nutrition.protein += Number(log.protein) || 0;
            nutrition.carbs += Number(log.carbs) || 0;
            nutrition.fats += Number(log.fats) || 0;
        });

        // 5. Habits
        const habits = await Habit.find({ user: userId }).lean();
        // In a real app we'd fetch HabitLogs for today, but keeping it simple based on existing schemas

        res.status(200).json({
            user: {
                name: user.name,
                onboardingCompleted: user.profile?.onboardingCompleted || false
            },
            goal: activeGoal,
            plan: activePlan,
            workout: todayWorkout,
            nutrition,
            habits
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard data.' });
    }
};

module.exports = {
    getTodayDashboard
};
