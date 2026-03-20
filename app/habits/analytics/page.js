'use client';

import { useState, useEffect } from 'react';
import { IoArrowBack, IoTrendingUpOutline, IoFlameOutline, IoCalendarOutline } from 'react-icons/io5';
import Link from 'next/link';
import { getHabits, getHabitLogs } from '@/lib/storage';
import styles from './page.module.css';

export default function HabitAnalyticsPage() {
    const [habits, setHabits] = useState([]);
    const [logs, setLogs] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        async function loadData() {
            setHabits(await getHabits());
            setLogs(await getHabitLogs());
            setMounted(true);
        }
        loadData();
    }, []);

    if (!mounted) return null;

    // Helper functions for analytics
    const calculateStreak = (habitId) => {
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        // Sort logs by date descending
        const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
        
        // Calculate sequence
        const todayStr = new Date().toISOString().split('T')[0];
        let expectedDate = new Date(todayStr);

        for (const log of sortedLogs) {
             if (log.completedHabitIds.includes(habitId)) {
                 tempStreak++;
                 if (tempStreak > bestStreak) bestStreak = tempStreak;
             } else {
                 tempStreak = 0;
             }
        }

        // Current streak (only counts if completed today or yesterday)
        let cStreak = 0;
        const d = new Date();
        while (true) {
            const dStr = d.toISOString().split('T')[0];
            const logDay = logs.find(l => l.date === dStr);
            if (logDay && logDay.completedHabitIds.includes(habitId)) {
                cStreak++;
                d.setDate(d.getDate() - 1);
            } else {
                if (cStreak === 0 && dStr === todayStr) {
                    // It's fine if they haven't done it today yet, check yesterday
                    d.setDate(d.getDate() - 1);
                    const logYest = logs.find(l => l.date === d.toISOString().split('T')[0]);
                    if (!logYest || !logYest.completedHabitIds.includes(habitId)) {
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        return { currentStreak: cStreak, bestStreak };
    };

    const getLast30Days = () => {
        const today = new Date();
        return Array.from({ length: 30 }).map((_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (29 - i));
            return d.toISOString().split('T')[0];
        });
    };

    const last30Days = getLast30Days();

    return (
        <div className={styles.page}>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link href="/habits" className="btn-icon" style={{ background: 'var(--bg-card)' }}>
                        <IoArrowBack size={20} />
                    </Link>
                    <div>
                        <h1 className="page-title">
                            <span className="page-title-gradient">Habit Analytics</span>
                        </h1>
                        <p className="page-subtitle">Track your consistency and streaks</p>
                    </div>
                </div>
            </div>

            <div className={styles.habitsGrid}>
                {habits.map(habit => {
                    const habitId = habit._id || habit.id;
                    const { currentStreak, bestStreak } = calculateStreak(habitId);
                    
                    const monthlyCompletions = last30Days.reduce((sum, dateStr) => {
                        const log = logs.find(l => l.date === dateStr);
                        return sum + (log?.completedHabitIds.includes(habitId) ? 1 : 0);
                    }, 0);

                    const completionRate = Math.round((monthlyCompletions / 30) * 100);

                    return (
                        <div key={habitId} className={styles.analyticsCard}>
                            <h2 className={styles.habitName}>{habit.name}</h2>
                            
                            <div className={styles.statsRow}>
                                <div className={styles.statBox}>
                                    <IoCalendarOutline size={18} style={{ color: '#06b6d4' }} />
                                    <div className={styles.statValue}>{completionRate}%</div>
                                    <div className={styles.statLabel}>30-Day Rate</div>
                                </div>
                                <div className={styles.statBox}>
                                    <IoFlameOutline size={18} style={{ color: '#f59e0b' }} />
                                    <div className={styles.statValue}>{currentStreak}</div>
                                    <div className={styles.statLabel}>Current Streak</div>
                                </div>
                                <div className={styles.statBox}>
                                    <IoTrendingUpOutline size={18} style={{ color: '#8b5cf6' }} />
                                    <div className={styles.statValue}>{bestStreak}</div>
                                    <div className={styles.statLabel}>Best Streak</div>
                                </div>
                            </div>

                            <div className={styles.heatmapContainer}>
                                <div className={styles.heatmapLabel}>Last 30 Days</div>
                                <div className={styles.heatmapGrid}>
                                    {last30Days.map(dateStr => {
                                        const isDone = logs.find(l => l.date === dateStr)?.completedHabitIds.includes(habitId);
                                        return (
                                            <div 
                                                key={dateStr} 
                                                className={`${styles.heatmapCell} ${isDone ? styles.heatmapCellDone : ''}`}
                                                title={dateStr}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {habits.length === 0 && (
                <div className="empty-inline">No habits found. Start building habits to see analytics!</div>
            )}
        </div>
    );
}
