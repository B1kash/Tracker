const User = require('../models/User');
const Squad = require('../models/Squad');
const { v4: uuidv4 } = require('uuid');

// @desc    Get Global & Friends Leaderboard
// @route   GET /api/social/leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const globalTop = await User.find({ isPrivate: { $ne: true } })
            .sort({ 'gamification.xp': -1 })
            .limit(10)
            .select('username gamification.level gamification.xp gamification.currentStreak');

        const currentUser = await User.findById(req.user.id).populate('friends', 'username gamification.level gamification.xp gamification.currentStreak');
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        const friendsData = currentUser.friends || [];
        const friendsLeaderboard = [...friendsData, {
            _id: currentUser._id,
            username: currentUser.username,
            gamification: currentUser.gamification
        }].sort((a, b) => b.gamification.xp - a.gamification.xp);

        res.json({ global: globalTop, friends: friendsLeaderboard });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a friend
// @route   POST /api/social/friends
const addFriend = async (req, res) => {
    try {
        const { username } = req.body;
        const friend = await User.findOne({ username });
        if (!friend) return res.status(404).json({ message: 'User not found' });
        if (friend.isPrivate) return res.status(404).json({ message: 'User not found' }); // Hide private users
        if (friend._id.toString() === req.user.id) return res.status(400).json({ message: "You can't add yourself" });

        const me = await User.findById(req.user.id);
        if (me.friends.includes(friend._id)) return res.status(400).json({ message: 'Already friends' });

        me.friends.push(friend._id);
        await me.save();
        res.json({ message: 'Friend added successfully' });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get current Squad details
// @route   GET /api/social/squad
const getSquad = async (req, res) => {
    try {
        const me = await User.findById(req.user.id).populate({
            path: 'squad',
            populate: { path: 'members', select: 'username gamification.level gamification.xp gamification.currentStreak' }
        });
        if (!me.squad) return res.json({ squad: null });
        res.json({ squad: me.squad });
    } catch (e) {
        res.status(500).json({ message: 'Server err' });
    }
};

// @desc    Create a Squad
// @route   POST /api/social/squad
const createSquad = async (req, res) => {
    try {
        const { name } = req.body;
        const me = await User.findById(req.user.id);
        if (me.squad) return res.status(400).json({ message: 'You are already in a squad' });

        const squad = await Squad.create({
            name,
            inviteCode: uuidv4().substring(0, 8).toUpperCase(),
            members: [me._id],
            currentQuest: {
                title: 'Weekly Combined Gym Visits',
                target: 15,
                current: 0,
                deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        });

        me.squad = squad._id;
        await me.save();
        res.json(squad);
    } catch (e) {
        res.status(500).json({ message: 'Server err' });
    }
};

// @desc    Join a Squad
// @route   POST /api/social/squad/join
const joinSquad = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        const squad = await Squad.findOne({ inviteCode });
        if (!squad) return res.status(404).json({ message: 'Invalid invite code' });

        const me = await User.findById(req.user.id);
        if (me.squad) return res.status(400).json({ message: 'Already in a squad' });

        squad.members.push(me._id);
        await squad.save();
        me.squad = squad._id;
        await me.save();
        res.json(squad);
    } catch (e) {
        res.status(500).json({ message: 'Server err' });
    }
};

module.exports = { getLeaderboard, addFriend, getSquad, createSquad, joinSquad };
