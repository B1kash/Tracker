'use client';

import { useState, useEffect } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { getCalendarData } from '@/lib/storage';
import styles from './page.module.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Score activity types -> number 0..4 (heatmap intensity)
function getActivityScore(activities) {
    if (!activities || activities.length === 0) return 0;
    return Math.min(activities.length, 4);
}

// Colors for heatmap: 0=empty, 1=low, 2=med, 3=high, 4=max
const HEAT_COLORS = {
    dark: ['rgba(30, 41, 59, 0.3)', 'rgba(139, 92, 246, 0.25)', 'rgba(139, 92, 246, 0.5)', 'rgba(139, 92, 246, 0.75)', 'rgba(139, 92, 246, 1)'],
    light: ['rgba(241, 245, 249, 0.5)', '#ddd6fe', '#a78bfa', '#7c3aed', '#5b21b6']
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState({});
    const [mounted, setMounted] = useState(false);
    const [theme, setTheme] = useState('dark');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        setTheme(document.documentElement.dataset.theme || 'dark');
    }, []);

    useEffect(() => {
        async function fetchCalendar() {
            const data = await getCalendarData(year, month + 1);
            setCalendarData(data || {});
            setMounted(true);
        }
        fetchCalendar();
    }, [year, month]);

    if (!mounted) return null;

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDay = (y, m) => new Date(y, m, 1).getDay();

    const colors = HEAT_COLORS[theme] || HEAT_COLORS.dark;

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDay(year, month);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className={styles.emptyCell} />);
        }

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const activities = calendarData[dateStr] || [];
            const score = getActivityScore(activities);
            const isToday = isCurrentMonth && today.getDate() === i;
            const bg = colors[score];

            const tooltip = activities.length
                ? activities.join(', ')
                : 'No activity';

            const activityIcons = {
                gym: '🏋️', learning: '📚', content: '🎬', habit: '✅'
            };

            days.push(
                <div
                    key={i}
                    className={`${styles.calendarCell} ${isToday ? styles.todayCell : ''}`}
                    style={{ background: bg, border: isToday ? '2px solid var(--accent-purple)' : '' }}
                    title={`${dateStr}: ${tooltip}`}
                >
                    <span className={styles.cellNumber}>{i}</span>
                    {score > 0 && (
                        <div className={styles.indicators}>
                            {activities.includes('gym') && <span title="Gym">{activityIcons.gym}</span>}
                            {activities.includes('habit') && <span title="Habits">{activityIcons.habit}</span>}
                            {activities.includes('learning') && <span title="Learning">{activityIcons.learning}</span>}
                            {activities.includes('content') && <span title="Content">{activityIcons.content}</span>}
                        </div>
                    )}
                </div>
            );
        }

        return days;
    };

    const totalActiveDays = Object.keys(calendarData).filter(d => {
        const [y, m] = d.split('-').map(Number);
        return y === year && (m - 1) === month;
    }).length;

    const maxStreak = (() => {
        let best = 0, cur = 0;
        for (let i = 1; i <= getDaysInMonth(year, month); i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (calendarData[dateStr]?.length > 0) { cur++; best = Math.max(best, cur); }
            else { cur = 0; }
        }
        return best;
    })();

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">
                        <span className="page-title-gradient">Calendar</span>
                    </h1>
                    <p className="page-subtitle">Your activity heatmap — the deeper the color, the more you did</p>
                </div>
            </div>

            <div className={styles.calendarCard}>
                <div className={styles.calendarHeader}>
                    <button className="btn-icon" onClick={prevMonth}>
                        <IoChevronBack size={20} />
                    </button>
                    <h2 className={styles.monthTitle}>{MONTHS[month]} {year}</h2>
                    <button className="btn-icon" onClick={nextMonth} disabled={new Date().getFullYear() === year && new Date().getMonth() === month}>
                        <IoChevronForward size={20} />
                    </button>
                </div>

                {/* Heatmap legend */}
                <div className={styles.legend}>
                    <span className={styles.legendLabel}>Less</span>
                    {colors.map((c, i) => (
                        <div key={i} className={styles.legendSwatch} style={{ background: c }} />
                    ))}
                    <span className={styles.legendLabel}>More</span>
                </div>

                <div className={styles.calendarGrid}>
                    {DAYS.map(day => (
                        <div key={day} className={styles.dayHeaderCell}>{day}</div>
                    ))}
                    {renderCalendarGrid()}
                </div>

                <div className={styles.calendarFooter}>
                    <div className={styles.footerStat}>
                        <span className={styles.footerNum}>{totalActiveDays}</span>
                        <span>active days</span>
                    </div>
                    <div className={styles.footerDivider} />
                    <div className={styles.footerStat}>
                        <span className={styles.footerNum}>{maxStreak}</span>
                        <span>best streak this month</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
