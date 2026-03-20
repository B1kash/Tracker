const cron = require('node-cron');
const UserSettings = require('../models/UserSettings');
const HabitLog = require('../models/HabitLog');
const GymWorkout = require('../models/GymWorkout');
const { sendPushToUser } = require('../controllers/pushController');

// Run every hour at minute 0
cron.schedule('0 * * * *', async () => {
    try {
        const currentHourStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

        const settingsList = await UserSettings.find();

        for (const settings of settingsList) {
            // 1. Habit Reminder Evaluation
            if (settings.habitReminderTime && settings.habitReminderTime === currentHourStr) {
                const todayStr = new Date().toISOString().split('T')[0];
                const habitLog = await HabitLog.findOne({ user: settings.user, date: todayStr });
                
                if (!habitLog || habitLog.completedHabitIds.length === 0) {
                    await sendPushToUser(settings.user, {
                        title: 'Habit Reminder!',
                        body: 'You have pending habits today. Time to knock them out!',
                        url: '/habits'
                    });
                }
            }

            // 2. Rest Day Evaluation (trigger at 6 PM local default roughly, or just if it's 18:00)
            if (currentHourStr === '18:00') {
                const today = new Date();
                const past3Days = Array.from({length: 3}).map((_, i) => {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                });

                const workouts = await GymWorkout.find({
                    user: settings.user,
                    date: { $in: past3Days }
                });

                if (workouts.length === 0) {
                    await sendPushToUser(settings.user, {
                        title: 'Resting hard?',
                        body: "It's been 3 days since your last logged workout. Time to hit the gym!",
                        url: '/gym'
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in cron job', error);
    }
});
