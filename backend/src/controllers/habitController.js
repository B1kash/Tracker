const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// @desc    Get user habits
// @route   GET /api/habits
// @access  Private
const getHabits = async (req, res) => {
    try {
        const habits = await Habit.find({ user: req.user.id });
        res.status(200).json(habits);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a new habit
// @route   POST /api/habits
// @access  Private
const addHabit = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const habit = await Habit.create({ user: req.user.id, name });
        res.status(201).json(habit);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
const deleteHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ message: 'Habit not found' });
        if (habit.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await habit.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all habit logs
// @route   GET /api/habits/logs
// @access  Private
const getAllHabitLogs = async (req, res) => {
    try {
        const logs = await HabitLog.find({ user: req.user.id });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get habit log by date
// @route   GET /api/habits/logs/:dateStr
// @access  Private
const getHabitLogByDate = async (req, res) => {
    try {
        const { dateStr } = req.params;
        let log = await HabitLog.findOne({ user: req.user.id, date: dateStr });
        if (!log) {
            log = { date: dateStr, completedHabitIds: [] };
        }
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Toggle habit log status
// @route   POST /api/habits/logs
// @access  Private
const toggleHabitLog = async (req, res) => {
    try {
        const { dateStr, habitId } = req.body;

        let log = await HabitLog.findOne({ user: req.user.id, date: dateStr });
        let newlyCompleted = false;

        if (!log) {
            log = await HabitLog.create({
                user: req.user.id,
                date: dateStr,
                completedHabitIds: [habitId]
            });
            newlyCompleted = true;
        } else {
            // Clean up any stray null values that may have gotten into the db
            log.completedHabitIds = log.completedHabitIds.filter(id => id != null);

            const isCompleted = log.completedHabitIds.some(id => id.toString() === habitId);
            if (isCompleted) {
                log.completedHabitIds = log.completedHabitIds.filter(id => id.toString() !== habitId);
            } else {
                log.completedHabitIds.push(habitId);
                newlyCompleted = true;
            }
            await log.save();
        }

        res.status(200).json({ log, newlyCompleted });
    } catch (error) {
        console.error("TOGGLE ERROR:", error);
        res.status(500).json({ message: String(error), stack: error.stack });
    }
};

module.exports = { getHabits, addHabit, deleteHabit, getAllHabitLogs, getHabitLogByDate, toggleHabitLog };
