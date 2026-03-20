const webpush = require('web-push');
const UserSettings = require('../models/UserSettings');
const User = require('../models/User');

const PUBLIC_VAPID = process.env.VAPID_PUBLIC_KEY || 'BOJddyvt3DbL7031pgkdsAE8NdlHgNu8LH-RiVgFAHaAU4OsvfUOYAxJNj6Vuh_B6EXZ-gcQSnQGeVJ6mGhbegM';
const PRIVATE_VAPID = process.env.VAPID_PRIVATE_KEY || '6LNRDDABzMZst6EqpXqAB-ppPsWseNgQZvxWlksLepI';

webpush.setVapidDetails('mailto:tracker@example.com', PUBLIC_VAPID, PRIVATE_VAPID);

// @route GET /api/push/public-key
const getPublicKey = (req, res) => {
    res.status(200).json({ publicKey: PUBLIC_VAPID });
};

// @route POST /api/push/subscribe
const subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint) return res.status(400).json({ message: 'Invalid subscription' });

        await UserSettings.findOneAndUpdate(
            { user: req.user.id },
            { $addToSet: { pushSubscriptions: subscription } },
            { new: true, upsert: true }
        );

        res.status(201).json({ message: 'Subscribed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route GET /api/push/settings
const getSettings = async (req, res) => {
    try {
        const settings = await UserSettings.findOne({ user: req.user.id });
        res.status(200).json(settings || { habitReminderTime: '08:00', pushSubscriptions: [] });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @route PUT /api/push/settings
const updateSettings = async (req, res) => {
    try {
        const { habitReminderTime } = req.body;
        const settings = await UserSettings.findOneAndUpdate(
            { user: req.user.id },
            { habitReminderTime },
            { new: true, upsert: true }
        );
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper to push to a specific user
const sendPushToUser = async (userId, payload) => {
    const settings = await UserSettings.findOne({ user: userId });
    if (!settings || !settings.pushSubscriptions.length) return;

    for (const sub of settings.pushSubscriptions) {
        try {
            await webpush.sendNotification(sub, JSON.stringify(payload));
        } catch (error) {
            if (error.statusCode === 410 || error.statusCode === 404) {
                // Subscription has expired or is no longer valid
                settings.pushSubscriptions = settings.pushSubscriptions.filter(s => s.endpoint !== sub.endpoint);
                await settings.save();
            } else {
                console.error('Error sending push:', error);
            }
        }
    }
};

module.exports = { getPublicKey, subscribe, getSettings, updateSettings, sendPushToUser };
