"use client";

import styles from './MacroRings.module.css';

const MACROS = [
    { key: 'protein', label: 'Protein', unit: 'g', target: 150, color: '#8b5cf6', emoji: '💪' },
    { key: 'carbs',   label: 'Carbs',   unit: 'g', target: 250, color: '#f59e0b', emoji: '🌾' },
    { key: 'fats',    label: 'Fats',    unit: 'g', target: 65,  color: '#f43f5e', emoji: '🥑' },
    { key: 'calories',label: 'Calories',unit: 'kcal', target: 2200, color: '#06b6d4', emoji: '🔥' },
];

function Ring({ value, target, color, size = 80, strokeWidth = 7 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.min((value / target) * 100, 100);
    const offset = circumference - (pct / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
        </svg>
    );
}

export default function MacroRings({ dietEntries, targets }) {
    const goals = {
        protein: targets?.protein || 150,
        carbs: targets?.carbs || 250,
        fats: targets?.fats || 65,
        calories: targets?.calories || 2200
    };

    const totals = (dietEntries || []).reduce((acc, entry) => {
        acc.calories += parseInt(entry.calories) || 0;
        acc.protein  += parseInt(entry.protein)  || 0;
        acc.carbs    += parseInt(entry.carbs)    || 0;
        acc.fats     += parseInt(entry.fats)     || 0;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Daily Macro Targets</h3>
                <span className={styles.hint}>Log meals below to track progress</span>
            </div>
            <div className={styles.rings}>
                {MACROS.map(m => {
                    const val = totals[m.key];
                    const target = goals[m.key];
                    const pct = Math.min(Math.round((val / target) * 100), 100);
                    return (
                        <div key={m.key} className={styles.ringCard}>
                            <div className={styles.ringWrapper}>
                                <Ring value={val} target={target} color={m.color} size={76} strokeWidth={7} />
                                <div className={styles.ringCenter}>
                                    <span className={styles.ringEmoji}>{m.emoji}</span>
                                </div>
                            </div>
                            <div className={styles.ringLabel}>{m.label}</div>
                            <div className={styles.ringValue} style={{ color: m.color }}>
                                {val}<span className={styles.ringUnit}>{m.unit}</span>
                            </div>
                            <div className={styles.ringTarget}>/ {target}{m.unit}</div>
                            <div className={styles.ringPct} style={{ color: pct >= 100 ? '#10b981' : 'var(--text-muted)' }}>
                                {pct}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
