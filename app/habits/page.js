'use client';

import { useState, useEffect } from 'react';
import { IoCheckmarkSharp, IoTrashOutline, IoAdd, IoSettingsOutline, IoAnalyticsOutline } from 'react-icons/io5';
import EmptyState from '@/components/EmptyState';
import AddGoalModal from '@/components/AddGoalModal';
import Link from 'next/link';
import { getHabits, addHabit, deleteHabit, getHabitLogByDate, toggleHabitLog } from '@/lib/storage';
import { triggerGamificationUpdate } from '@/lib/events';
import styles from './page.module.css';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDateStr(date) { return date.toISOString().split('T')[0]; }

function getWeekDates(centerDate) {
    const dates = [];
    const start = new Date(centerDate);
    start.setDate(start.getDate() - 3);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
    }
    return dates;
}

export default function HabitsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [habits, setHabits] = useState([]);
    const [currentLog, setCurrentLog] = useState({ completedHabitIds: [] });
    const [mounted, setMounted] = useState(false);

    // Modal state for adding a new habit
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');

    const dateStr = getDateStr(selectedDate);
    const weekDates = getWeekDates(selectedDate);
    const todayStr = getDateStr(new Date());
    const isFuture = dateStr > todayStr;

    useEffect(() => {
        async function fetchHabits() {
            setHabits(await getHabits());
            setCurrentLog(await getHabitLogByDate(dateStr));
            setMounted(true);
        }
        fetchHabits();
    }, [dateStr]);

    if (!mounted) return null;

    const handleToggleHabit = async (habitId) => {
        const updatedLog = await toggleHabitLog(dateStr, habitId);
        setCurrentLog(updatedLog);
        triggerGamificationUpdate();
    };

    const handleAddHabit = async (e) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;
        await addHabit({ name: newHabitName.trim() });
        setHabits(await getHabits());
        setNewHabitName('');
        setIsManageModalOpen(false);
    };

    const handleDeleteHabit = async (habitId) => {
        await deleteHabit(habitId);
        setHabits(await getHabits());
    };

    const completedCount = habits.filter(h => currentLog.completedHabitIds.includes(h._id || h.id)).length;
    const totalCount = habits.length;

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">
                        <span className="page-title-gradient">Daily Habits</span>
                    </h1>
                    <p className="page-subtitle">
                        {dateStr === todayStr ? "Today's checklist" : `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`}
                        {totalCount > 0 && ` — ${completedCount}/${totalCount} completed`}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link href="/habits/analytics" className="btn btn-secondary">
                        <IoAnalyticsOutline size={18} /> Analytics
                    </Link>
                    <button className="btn btn-ghost" onClick={() => setIsManageModalOpen(true)}>
                        <IoSettingsOutline size={18} /> Manage Habits
                    </button>
                </div>
            </div>

            {/* Date Strip */}
            <div className="date-strip">
                {weekDates.map((d) => {
                    const ds = getDateStr(d);
                    const isActive = ds === dateStr;
                    return (
                        <button key={ds} className={`date-chip ${isActive ? 'active' : ''}`} onClick={() => setSelectedDate(d)}>
                            <span className="date-chip-day">{DAYS_SHORT[d.getDay()]}</span>
                            <span className="date-chip-num">{d.getDate()}</span>
                        </button>
                    );
                })}
            </div>

            {habits.length === 0 ? (
                <EmptyState
                    title="No habits defined"
                    message="Set up your daily micro-habits like 'Drink water', 'Read 10 pages', or 'Meditate'."
                />
            ) : (
                <div className={styles.habitList}>
                    {habits.map((habit) => {
                        const habitId = habit._id || habit.id;
                        const isDone = currentLog.completedHabitIds.includes(habitId);
                        return (
                            <div key={habitId} className={`${styles.habitCard} ${isDone ? styles.habitCardDone : ''}`}>
                                <button
                                    className={`${styles.checkBtn} ${isDone ? styles.checkBtnDone : ''}`}
                                    onClick={() => handleToggleHabit(habitId)}
                                    disabled={isFuture}
                                    style={isFuture ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                >
                                    {isDone && <IoCheckmarkSharp size={20} />}
                                </button>
                                <div className={styles.habitInfo}>
                                    <h3 className={styles.habitTitle}>{habit.name}</h3>
                                </div>
                                <div className={styles.habitActions}>
                                    <button className="btn-icon" onClick={() => handleDeleteHabit(habitId)} title="Delete Habit">
                                        <IoTrashOutline size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <AddGoalModal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                title="Add New Daily Habit"
                onSubmit={handleAddHabit}
            >
                <div className="form-group">
                    <label className="form-label">Habit Name</label>
                    <input
                        className="form-input"
                        placeholder="e.g. Drink 2L water"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
            </AddGoalModal>
        </div>
    );
}
