const User = require('../models/User');

const DEFAULT_QUESTS = [
    { title: 'Workout Warrior', target: 4, xpReward: 500, type: 'gym' },
    { title: 'Cardio King', target: 3, xpReward: 300, type: 'cardio' },
    { title: 'Consistent Habits', target: 5, xpReward: 200, type: 'habits' },
    { title: 'Healthy Eater', target: 5, xpReward: 250, type: 'diet' }
];

const getMonday = (d) => {
    d = new Date(d);
    const day = d.getDay(),
        diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const handleWeeklyReset = (user) => {
    let modified = false;
    const now = new Date();
    const thisMonday = getMonday(now);

    if (!user.gamification.lastQuestReset || new Date(user.gamification.lastQuestReset) < thisMonday) {
        user.gamification.quests = DEFAULT_QUESTS.map(q => ({ ...q, current: 0, completed: false }));
        user.gamification.lastQuestReset = now;
        
        // Reset Rest Days based on weekly goal
        const targetDays = user.gamification.weeklyTrainDays || 5;
        user.gamification.restDaysAvailable = Math.max(0, 7 - targetDays);
        modified = true;
    }
    return modified;
};

// @desc    Get Gamification Data
// @route   GET /api/gamification
// @access  Private
const getGamificationData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        const resetOccurred = handleWeeklyReset(user);
        if (resetOccurred) {
            user.markModified('gamification');
            await user.save();
        }

        res.status(200).json(user.gamification);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add XP
// @route   POST /api/gamification/xp
// @access  Private
const addXP = async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user.id);

        const currentXp = user.gamification?.xp || 0;
        const XP_PER_LEVEL = 1000;
        const oldLevel = Math.floor(currentXp / XP_PER_LEVEL) + 1;
        const newXp = currentXp + amount;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

        user.gamification.xp = newXp;
        user.gamification.level = newLevel;

        user.markModified('gamification');
        await user.save();

        res.status(200).json({
            ...user.gamification.toObject(),
            leveledUp: newLevel > oldLevel
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Check and Update Streak
// @route   POST /api/gamification/streak
// @access  Private
const checkAndUpdateStreak = async (req, res) => {
    try {
        const { dateStr } = req.body;
        const user = await User.findById(req.user.id);

        const dateStrParsed = new Date(dateStr);
        dateStrParsed.setHours(0, 0, 0, 0);

        handleWeeklyReset(user);

        if (!user.gamification.lastActiveDate) {
            user.gamification.currentStreak = 1;
            user.gamification.bestStreak = Math.max(user.gamification.bestStreak || 0, 1);
            user.gamification.lastActiveDate = dateStrParsed;
        } else {
            const lastActiveParsed = new Date(user.gamification.lastActiveDate);
            lastActiveParsed.setHours(0, 0, 0, 0);
            
            const diffTime = dateStrParsed - lastActiveParsed;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) { // Next consecutive day
                user.gamification.currentStreak = (user.gamification.currentStreak || 0) + 1;
                if (user.gamification.currentStreak > (user.gamification.bestStreak || 0)) {
                    user.gamification.bestStreak = user.gamification.currentStreak;
                }
            } else if (diffDays > 1) { // They missed one or more days
                const missedDays = diffDays - 1;
                
                // Do they have enough Rest Days to cover the gap?
                if ((user.gamification.restDaysAvailable || 0) >= missedDays) {
                    user.gamification.restDaysAvailable -= missedDays;
                    user.gamification.currentStreak = (user.gamification.currentStreak || 0) + diffDays;
                    if (user.gamification.currentStreak > (user.gamification.bestStreak || 0)) {
                        user.gamification.bestStreak = user.gamification.currentStreak;
                    }
                } else {
                    // Streak broken (Not enough rest days)
                    user.gamification.restDaysAvailable = 0;
                    user.gamification.currentStreak = 1;
                }
            }

            // Move the last active date forward if this is a newer date
            if (diffDays > 0) {
                user.gamification.lastActiveDate = dateStrParsed;
            }
        }

        user.markModified('gamification');
        await user.save();

        res.status(200).json(user.gamification);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateQuestProgress = async (userId, type, amount = 1) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.gamification.quests) return null;

        let totalXpGained = 0;
        let anyCompleted = false;

        user.gamification.quests = user.gamification.quests.map(quest => {
            if (quest.type === type && !quest.completed) {
                quest.current += amount;
                if (quest.current >= quest.target) {
                    quest.completed = true;
                    totalXpGained += quest.xpReward;
                    anyCompleted = true;
                }
            }
            return quest;
        });

        if (totalXpGained > 0) {
            const currentXp = user.gamification.xp || 0;
            const XP_PER_LEVEL = 1000;
            const oldLevel = Math.floor(currentXp / XP_PER_LEVEL) + 1;
            const newXp = currentXp + totalXpGained;
            const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

            user.gamification.xp = newXp;
            user.gamification.level = newLevel;

            // Note: In a real app we might want to return the leveledUp flag here too
        }

        if (amount > 0 || totalXpGained > 0) {
            user.markModified('gamification');
            await user.save();
        }

        return { quests: user.gamification.quests, xpGained: totalXpGained };
    } catch (error) {
        console.error('Quest update error:', error);
        return null;
    }
};

module.exports = { getGamificationData, addXP, checkAndUpdateStreak, updateQuestProgress };

// @desc    Update Gamification Settings
// @route   PUT /api/gamification/settings
// @access  Private
const updateGamificationSettings = async (req, res) => {
    try {
        const { weeklyTrainDays } = req.body;
        const user = await User.findById(req.user.id);
        
        if (weeklyTrainDays && weeklyTrainDays >= 1 && weeklyTrainDays <= 7) {
            user.gamification.weeklyTrainDays = weeklyTrainDays;
            
            // Re-calculate rest days available for the current week based on the new custom schedule
            // We use Math.max to avoid negative numbers if they change from 7 to say 3 in middle of week
            const newRestDaysLimit = 7 - weeklyTrainDays;
            user.gamification.restDaysAvailable = newRestDaysLimit;

            user.markModified('gamification');
            await user.save();
            return res.status(200).json(user.gamification);
        } else {
            return res.status(400).json({ message: 'Invalid training days ' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = { getGamificationData, addXP, checkAndUpdateStreak, updateQuestProgress, updateGamificationSettings };
