const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { uploadToS3, deleteFromS3 } = require('../config/s3');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    // Since we are using JWT in localStorage, the actual logout happens on the frontend
    // by deleting the token. This endpoint is mostly for completeness or if we switch to cookies.
    res.status(200).json({ message: 'Logged out successfully' });
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please add all fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({ username, password });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                gamification: user.gamification,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check for user email
        const user = await User.findOne({ username });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                username: user.username,
                gamification: user.gamification,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update diet targets
// @route   PUT /api/auth/diet-targets
// @access  Private
const updateDietTargets = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.dietTargets = {
                calories: req.body.calories || user.dietTargets.calories,
                protein: req.body.protein || user.dietTargets.protein,
                carbs: req.body.carbs || user.dietTargets.carbs,
                fats: req.body.fats || user.dietTargets.fats,
            };
            await user.save();
            res.status(200).json(user.dietTargets);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Google Login / Registration
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        const email = payload['email'];
        const name = payload['name'];

        let user = await User.findOne({ $or: [{ email }, { googleId: userid }] });

        if (!user) {
            // New User Registration
            let baseUsername = name ? name.replace(/\s+/g, '').toLowerCase() : email.split('@')[0];
            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user = await User.create({
                username,
                email,
                googleId: userid
            });
        } else if (!user.googleId || !user.email) {
            user.googleId = userid;
            user.email = email;
            await user.save();
        }

        res.json({
            _id: user.id,
            username: user.username,
            gamification: user.gamification,
            isPrivate: user.isPrivate,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
};

// @desc    Toggle Privacy
// @route   PUT /api/auth/privacy
// @access  Private
const togglePrivacy = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.isPrivate = !user.isPrivate;
        await user.save();
        res.status(200).json({ isPrivate: user.isPrivate });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
// @desc    Update User Profile Stats (Name, Weight Targets, etc.)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.name = req.body.name || user.name;
        user.height = req.body.height !== undefined ? req.body.height : user.height;
        user.targetWeight = req.body.targetWeight !== undefined ? req.body.targetWeight : user.targetWeight;
        user.targetBmi = req.body.targetBmi !== undefined ? req.body.targetBmi : user.targetBmi;

        if (req.body.profilePicBase64) {
            const mimetype = req.body.profilePicMime || 'image/jpeg';
            if (['image/jpeg', 'image/png', 'image/webp'].includes(mimetype)) {
                if (user.profilePic) await deleteFromS3(user.profilePic);
                const cleanBase64 = req.body.profilePicBase64.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(cleanBase64, 'base64');
                user.profilePic = await uploadToS3(buffer, mimetype, 'avatars');
            }
        }

        await user.save();
        res.status(200).json({ 
            name: user.name, 
            height: user.height, 
            targetWeight: user.targetWeight, 
            targetBmi: user.targetBmi,
            profilePic: user.profilePic
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update Password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new passwords are required' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

        const user = await User.findById(req.user.id);
        if (!user || user.googleId && !user.password) {
             return res.status(400).json({ message: 'Cannot reset password for Google-only account' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(401).json({ message: 'Invalid current password' });

        user.password = newPassword;
        await user.save();
        
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    getMe,
    logoutUser,
    updateDietTargets,
    togglePrivacy,
    updateProfile,
    updatePassword
};
