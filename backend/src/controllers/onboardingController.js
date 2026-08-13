const User = require('../models/User');
const Goal = require('../models/Goal');

// @desc    Submit Onboarding Data
// @route   POST /api/onboarding
// @access  Private
const submitOnboarding = async (req, res) => {
    try {
        const { profile, goal } = req.body;
        
        // 1. Update User Profile
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.profile = {
            ...user.profile,
            ...profile,
            onboardingCompleted: true,
            profileUpdatedAt: new Date()
        };
        await user.save();

        // 2. Create or Update Primary Goal
        if (goal) {
            let activeGoal = await Goal.findOne({ user: req.user.id, isPrimary: true });
            
            if (activeGoal) {
                // Archive old primary goal if it exists and differs
                activeGoal.isPrimary = false;
                await activeGoal.save();
            }

            // Create new primary goal
            await Goal.create({
                user: req.user.id,
                title: goal.title,
                description: goal.description,
                type: goal.type,
                isPrimary: true,
                startDate: new Date().toISOString().split('T')[0], // today
                targetDate: goal.targetDate || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0], // default 3 months
                startingValue: goal.startingValue,
                targetValue: goal.targetValue,
                currentValue: goal.startingValue,
                unit: goal.unit
            });
        }

        res.status(200).json({ message: 'Onboarding completed successfully.' });
    } catch (error) {
        console.error('Onboarding Error:', error);
        res.status(500).json({ message: 'Failed to save onboarding data.' });
    }
};

module.exports = {
    submitOnboarding
};
