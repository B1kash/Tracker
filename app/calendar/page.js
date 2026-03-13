'use client';

import { useState, useEffect } from 'react';
import { IoChevronBack, IoChevronForward, IoBarbell, IoBookOutline, IoVideocamOutline, IoCheckboxOutline } from 'react-icons/io5';
import EmptyState from '@/components/EmptyState';
import { getCalendarData } from '@/lib/storage';
import styles from './page.module.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState({});
    const [mounted, setMounted] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    useEffect(() => {
        async function fetchCalendar() {
            setCalendarData(await getCalendarData(year, month + 1));
            setMounted(true);
        }
        fetchCalendar();
    }, [year, month]);

    if (!mounted) return null;

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className={styles.emptyCell}></div>);
        }

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const activities = calendarData[dateStr] || [];
            const isToday = isCurrentMonth && today.getDate() === i;

            days.push(
                <div key={i} className={`${styles.calendarCell} ${isToday ? styles.todayCell : ''}`}>
                    <span className={styles.cellNumber}>{i}</span>
                    <div className={styles.indicators}>
                        {activities.includes('gym') && <span className={`${styles.dot} ${styles.dotGym}`} title="Gym" />}
                        {activities.includes('learning') && <span className={`${styles.dot} ${styles.dotLearning}`} title="Learning" />}
                        {activities.includes('content') && <span className={`${styles.dot} ${styles.dotContent}`} title="Content" />}
                        {activities.includes('habit') && <span className={`${styles.dot} ${styles.dotHabit}`} title="Habit" />}
                    </div>
                </div>
            );
        }

        return days;
    };

    const totalActiveDays = Object.keys(calendarData).length;

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">
                        <span className="page-title-gradient">Calendar</span>
                    </h1>
                    <p className="page-subtitle">Your activity overview across all dimensions</p>
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

                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={`${styles.dot} ${styles.dotGym}`} /> Gym
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.dot} ${styles.dotLearning}`} /> Learning
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.dot} ${styles.dotContent}`} /> Content
                    </div>
                    <div className={styles.legendItem}>
                        <span className={`${styles.dot} ${styles.dotHabit}`} /> Habits
                    </div>
                </div>

                <div className={styles.calendarGrid}>
                    {DAYS.map(day => (
                        <div key={day} className={styles.dayHeaderCell}>{day}</div>
                    ))}
                    {renderCalendarGrid()}
                </div>

                <div className={styles.calendarFooter}>
                    <p>Total active days this month: <strong>{totalActiveDays}</strong></p>
                </div>
            </div>
        </div>
    );
}
