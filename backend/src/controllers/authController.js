const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

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
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleLogin,
    getMe,
    logoutUser,
    updateDietTargets
};
