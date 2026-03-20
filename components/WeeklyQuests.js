"use client";

import { useState, useEffect } from 'react';
import { IoTrophyOutline, IoRefreshOutline } from 'react-icons/io5';
import { getGamificationData } from '@/lib/storage';
import styles from './WeeklyQuests.module.css';

const QUEST_ICONS = { gym: '🏋️', cardio: '🏃', habits: '✅', diet: '🥗' };
const QUEST_COLORS = { gym: '#f43f5e', cardio: '#f59e0b', habits: '#10b981', diet: '#06b6d4' };

export default function WeeklyQuests() {
    const [quests, setQuests] = useState([]);
    const [lastReset, setLastReset] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchQuests = async () => {
        try {
            const data = await getGamificationData();
            setQuests(data?.quests || []);
            setLastReset(data?.lastQuestReset);
        } catch {}
        setLoading(false);
    };

    useEffect(() => {
        fetchQuests();
        // Re-check on gamification events
        const handler = () => fetchQuests();
        window.addEventListener('gamification_updated', handler);
        return () => window.removeEventListener('gamification_updated', handler);
    }, []);

    const getNextMonday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = (day === 0 ? 1 : 8 - day);
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        const opts = { weekday: 'short', month: 'short', day: 'numeric' };
        return d.toLocaleDateString(undefined, opts);
    };

    if (loading) return null;
    if (!quests || quests.length === 0) return null;

    const completedCount = quests.filter(q => q.completed).length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <IoTrophyOutline size={20} className={styles.headerIcon} />
                    <h2 className={styles.title}>Weekly Quests</h2>
                </div>
                <div className={styles.resetInfo}>
                    <IoRefreshOutline size={13} />
                    <span>Resets {getNextMonday()}</span>
                </div>
            </div>
            <div className={styles.summary}>
                <span className={styles.summaryCount}>{completedCount}/{quests.length}</span>
                <span className={styles.summaryLabel}> quests complete this week</span>
            </div>
            <div className={styles.questGrid}>
                {quests.map((quest, i) => {
                    const progress = Math.min((quest.current / quest.target) * 100, 100);
                    const color = QUEST_COLORS[quest.type] || '#8b5cf6';
                    return (
                        <div key={i} className={`${styles.questCard} ${quest.completed ? styles.questCompleted : ''}`}>
                            <div className={styles.questTop}>
                                <span className={styles.questIcon}>{QUEST_ICONS[quest.type]}</span>
                                <div className={styles.questInfo}>
                                    <div className={styles.questTitle}>{quest.title}</div>
                                    <div className={styles.questProgress}>{quest.current}/{quest.target}</div>
                                </div>
                                <div className={styles.questXP}>+{quest.xpReward} XP</div>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progress}%`, background: color }}
                                />
                            </div>
                            {quest.completed && <div className={styles.completedBadge}>✓ Complete!</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
