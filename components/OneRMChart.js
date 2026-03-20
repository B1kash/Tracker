"use client";

import { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import styles from './OneRMChart.module.css';

const CORE_LIFTS = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row'];
const LIFT_COLORS = ['#8b5cf6', '#f43f5e', '#f59e0b', '#06b6d4', '#10b981'];

// Epley formula: 1RM = weight * (1 + reps/30)
function calc1RM(weight, reps) {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (!w || !r || r <= 0) return null;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30));
}

function extractLiftName(name) {
    if (!name) return '';
    const lower = name.toLowerCase();
    for (const lift of CORE_LIFTS) {
        if (lower.includes(lift.toLowerCase())) return lift;
    }
    return null;
}

export default function OneRMChart({ allWorkouts }) {
    const chartData = useMemo(() => {
        if (!allWorkouts || allWorkouts.length === 0) return [];

        // Map: date -> { liftName: max1RM }
        const byDate = {};

        for (const workout of allWorkouts) {
            const date = workout.date;
            if (!byDate[date]) byDate[date] = {};

            for (const exercise of workout.exercises || []) {
                const liftName = extractLiftName(exercise.name);
                if (!liftName) continue;

                for (const set of exercise.sets || []) {
                    const orm = calc1RM(set.weight, set.reps);
                    if (!orm) continue;
                    if (!byDate[date][liftName] || orm > byDate[date][liftName]) {
                        byDate[date][liftName] = orm;
                    }
                }
            }
        }

        // Convert to sorted array
        return Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, lifts]) => ({ date, ...lifts }));
    }, [allWorkouts]);

    // Which lifts actually have data?
    const activeLifts = useMemo(() => {
        const found = new Set();
        for (const row of chartData) {
            for (const lift of CORE_LIFTS) {
                if (row[lift] != null) found.add(lift);
            }
        }
        return CORE_LIFTS.filter(l => found.has(l));
    }, [chartData]);

    if (chartData.length === 0 || activeLifts.length === 0) return null;

    const formatDate = (str) => {
        if (!str) return '';
        const d = new Date(str);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>📈 Estimated 1RM Progression</h2>
            <p className={styles.subtitle}>Track your strength gains over time (Epley formula)</p>
            <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        unit="kg"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(139,92,246,0.3)',
                            borderRadius: '10px',
                            fontSize: '12px'
                        }}
                        formatter={(val, name) => [`${val} kg`, name]}
                        labelFormatter={formatDate}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    {activeLifts.map((lift, i) => (
                        <Line
                            key={lift}
                            type="monotone"
                            dataKey={lift}
                            stroke={LIFT_COLORS[i % LIFT_COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: LIFT_COLORS[i % LIFT_COLORS.length] }}
                            activeDot={{ r: 6 }}
                            connectNulls={true}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
