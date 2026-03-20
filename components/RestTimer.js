"use client";

import { useState, useEffect, useRef } from 'react';
import { IoClose, IoPlayOutline, IoPauseOutline, IoRefreshOutline } from 'react-icons/io5';
import styles from './RestTimer.module.css';

const DEFAULT_SECONDS = 90;

export default function RestTimer() {
    const [visible, setVisible] = useState(false);
    const [seconds, setSeconds] = useState(DEFAULT_SECONDS);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef(null);

    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.8);
        } catch {}
    };

    const startTimer = () => {
        setRunning(true);
        intervalRef.current = setInterval(() => {
            setSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    setRunning(false);
                    playBeep();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const pauseTimer = () => {
        clearInterval(intervalRef.current);
        setRunning(false);
    };

    const resetTimer = () => {
        clearInterval(intervalRef.current);
        setRunning(false);
        setSeconds(DEFAULT_SECONDS);
    };

    // Listen for global 'start_rest_timer' event dispatched by gym page on set completion
    useEffect(() => {
        const handleStart = () => {
            setVisible(true);
            resetTimer();
            // Auto-start after a small delay
            setTimeout(() => {
                setSeconds(DEFAULT_SECONDS);
                setRunning(true);
            }, 100);
        };
        window.addEventListener('start_rest_timer', handleStart);
        return () => window.removeEventListener('start_rest_timer', handleStart);
    }, []);

    // Control interval when running changes
    useEffect(() => {
        if (running) {
            startTimer();
        }
        return () => clearInterval(intervalRef.current);
    }, [running]); // eslint-disable-line

    if (!visible) return null;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const pct = (seconds / DEFAULT_SECONDS) * 100;
    const isDone = seconds === 0;
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (pct / 100) * circumference;

    return (
        <div className={`${styles.popup} ${isDone ? styles.popupDone : ''}`}>
            <div className={styles.header}>
                <span className={styles.label}>⏱ Rest Timer</span>
                <button className={styles.closeBtn} onClick={() => { resetTimer(); setVisible(false); }}>
                    <IoClose size={16} />
                </button>
            </div>

            <div className={styles.ring}>
                <svg width={90} height={90} viewBox="0 0 90 90">
                    <circle cx={45} cy={45} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
                    <circle
                        cx={45} cy={45} r={radius}
                        fill="none"
                        stroke={isDone ? '#f43f5e' : '#8b5cf6'}
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 45 45)"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                    />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="monospace">
                        {isDone ? 'GO!' : `${mins}:${String(secs).padStart(2, '0')}`}
                    </text>
                </svg>
            </div>

            <div className={styles.controls}>
                {running ? (
                    <button className={styles.btn} onClick={pauseTimer}><IoPauseOutline size={16} /> Pause</button>
                ) : (
                    <button className={styles.btn} onClick={() => setRunning(true)} disabled={isDone && seconds === 0}>
                        <IoPlayOutline size={16} /> {seconds === DEFAULT_SECONDS ? 'Start' : 'Resume'}
                    </button>
                )}
                <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetTimer}>
                    <IoRefreshOutline size={14} />
                </button>
            </div>
        </div>
    );
}
