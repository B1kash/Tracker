'use client';

import { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoTrashOutline, IoScaleOutline, IoBarbell, IoTrendingUpOutline } from 'react-icons/io5';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getBodyWeightLogs, upsertBodyWeight, deleteBodyWeight, getMe } from '@/lib/storage';
import styles from './page.module.css';

const MEASUREMENTS = [
    { key: 'bodyFat', label: 'Body Fat %', color: '#ec4899' },
    { key: 'chest', label: 'Chest', color: '#8b5cf6' },
    { key: 'waist', label: 'Waist', color: '#f43f5e' },
    { key: 'arms', label: 'Arms', color: '#06b6d4' },
    { key: 'hips', label: 'Hips', color: '#f59e0b' },
    { key: 'thighs', label: 'Thighs', color: '#10b981' },
];

function getToday() { return new Date().toISOString().split('T')[0]; }

function formatDate(str) {
    const d = new Date(str);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function BodyWeightPage() {
    const [logs, setLogs] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [form, setForm] = useState({
        date: getToday(),
        weight: '',
        bodyFat: '', chest: '', waist: '', arms: '', hips: '', thighs: '',
        notes: ''
    });
    const [showMeasurements, setShowMeasurements] = useState(false);

    const fetchLogs = useCallback(async () => {
        const [data, profile] = await Promise.all([
            getBodyWeightLogs(),
            getMe().catch(() => null)
        ]);
        setLogs(data);
        setUserProfile(profile);
        setMounted(true);
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.weight) return;
        setSaving(true);
        const payload = {};
        Object.entries(form).forEach(([k, v]) => {
            if (v !== '') payload[k] = ['weight', 'bodyFat', 'chest', 'waist', 'arms', 'hips', 'thighs'].includes(k) ? parseFloat(v) : v;
        });
        await upsertBodyWeight(payload);
        await fetchLogs();
        setSaving(false);
    };

    const handleDelete = async (id) => {
        await deleteBodyWeight(id);
        await fetchLogs();
    };

    if (!mounted) return null;

    // Prepare chart data
    const chartData = [...logs].sort((a, b) => a.date.localeCompare(b.date)).map(l => {
        let computedBmi = null;
        if (userProfile?.height && l.weight) {
            const hM = userProfile.height / 100;
            computedBmi = Number((l.weight / (hM * hM)).toFixed(1));
        }
        return { date: l.date, ...l, bmi: computedBmi };
    });

    const latest = logs.length > 0 ? logs[logs.length - 1] : null;
    const earliest = logs.length > 1 ? logs[0] : null;
    const weightDiff = latest && earliest
        ? (parseFloat(latest.weight) - parseFloat(earliest.weight)).toFixed(1)
        : null;

    // Goal Math & Predictions
    let goalText = null;
    let predictionText = null;
    
    if (userProfile?.targetWeight && latest?.weight) {
        const diff = latest.weight - userProfile.targetWeight;
        if (diff > 0) goalText = `📉 You need to lose ${diff.toFixed(1)}kg to reach your target weight of ${userProfile.targetWeight}kg. Keep going!`;
        else if (diff < 0) goalText = `📈 You need to gain ${Math.abs(diff).toFixed(1)}kg to reach your target weight of ${userProfile.targetWeight}kg.`;
        else goalText = `🏁 You have reached your target weight of ${userProfile.targetWeight}kg!`;
    }

    if (chartData.length >= 3 && userProfile?.height) {
        const recent = chartData.slice(-4);
        const wStart = recent[0].weight;
        const wEnd = recent[recent.length - 1].weight;
        const hM = userProfile.height / 100;
        
        let daysDiff = (new Date(recent[recent.length - 1].date) - new Date(recent[0].date)) / (1000*3600*24);
        if (daysDiff > 0) {
            const dailyRate = (wEnd - wStart) / daysDiff;
            // Extrapolate 30 days
            const projectedWeight = wEnd + (dailyRate * 30);
            const projectedBmi = Number((projectedWeight / (hM * hM)).toFixed(1));
            
            if (dailyRate < -0.01) {
                predictionText = `🔮 At your current pace, your BMI will reach ${projectedBmi} in 30 days!`;
            } else if (dailyRate > 0.01) {
                predictionText = `🔮 At your current pace, your BMI may climb to ${projectedBmi} in 30 days. Stay consistent!`;
            }
        }
    }

    const latestBmi = chartData.length > 0 ? chartData[chartData.length - 1].bmi : null;

    return (
        <div className={styles.page}>
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-title-gradient">⚖️ Body Weight</span>
                </h1>
                <p className="page-subtitle">Track your weight and body measurements over time</p>
            </div>

            {/* Summary cards */}
            {(goalText || predictionText) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                    {goalText && (
                        <div style={{ background: 'var(--bg-card)', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: 'var(--accent-purple)', padding: '8px', borderRadius: '50%' }}><IoTrendingUpOutline size={20} color="white" /></div>
                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{goalText}</div>
                        </div>
                    )}
                    {predictionText && (
                        <div style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(18, 15, 23, 0.9))', padding: '15px 20px', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: 'rgba(236,72,153,0.3)', padding: '8px', borderRadius: '50%' }}>✨</div>
                            <div style={{ fontWeight: '600', color: '#ec4899', letterSpacing: '0.3px' }}>AI Insight: {predictionText}</div>
                        </div>
                    )}
                </div>
            )}

            {latest && (
                <div className={styles.summaryRow}>
                    <div className={styles.summaryCard}>
                        <IoScaleOutline size={20} style={{ color: '#8b5cf6' }} />
                        <div>
                            <div className={styles.summaryValue}>{latest.weight} kg</div>
                            <div className={styles.summaryLabel}>Current Weight</div>
                        </div>
                    </div>
                    {latestBmi && (
                        <div className={styles.summaryCard}>
                            <IoBarbell size={20} style={{ color: '#ec4899' }} />
                            <div>
                                <div className={styles.summaryValue}>{latestBmi}</div>
                                <div className={styles.summaryLabel}>Current BMI</div>
                            </div>
                        </div>
                    )}
                    <div className={styles.summaryCard}>
                        <IoTrendingUpOutline size={20} style={{ color: weightDiff > 0 ? '#f43f5e' : '#10b981' }} />
                        <div>
                            <div className={styles.summaryValue} style={{ color: weightDiff > 0 ? '#f43f5e' : '#10b981' }}>
                                {weightDiff !== null ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : '—'}
                            </div>
                            <div className={styles.summaryLabel}>Total Change</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            {chartData.length >= 2 && (
                <div className={styles.chartCard} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div>
                        <h2 className={styles.chartTitle}>Weight Trend</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="kg" domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', fontSize: '12px' }}
                                    formatter={(v) => [`${v} kg`, 'Weight']}
                                    labelFormatter={formatDate}
                                />
                                <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} connectNulls />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {chartData.some(d => d.bmi) && (
                        <div>
                            <h2 className={styles.chartTitle} style={{ color: '#ec4899' }}>Smart BMI Trend</h2>
                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #ec4899', borderRadius: '10px', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="bmi" name="BMI" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #ec4899', marginTop: '10px' }}>
                                💡 <strong>BMI Limitation Awareness:</strong> BMI doesn’t differentiate between muscle mass and body fat. For a more accurate picture, complement it with Body Fat % or progress photos.
                            </div>
                        </div>
                    )}

                    {/* Measurement trends */}
                    {MEASUREMENTS.some(m => chartData.some(d => d[m.key])) && (
                        <>
                            <h2 className={styles.chartTitle} style={{ marginTop: 20 }}>Measurements (cm)</h2>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} unit="cm" domain={['auto', 'auto']} />
                                    <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                                    {MEASUREMENTS.map(m => (
                                        chartData.some(d => d[m.key]) &&
                                        <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2} dot={false} connectNulls />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </div>
            )}

            {/* Log Form */}
            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Log Today</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formRow}>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input type="date" className="form-input" value={form.date}
                                max={getToday()}
                                onChange={e => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Weight (kg) *</label>
                            <input type="number" step="0.1" className="form-input" placeholder="e.g. 75.5"
                                value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} required />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-end' }}>
                            <IoAdd size={18} /> {saving ? 'Saving...' : 'Log'}
                        </button>
                    </div>

                    <button type="button" className={styles.toggleMeasurements}
                        onClick={() => setShowMeasurements(!showMeasurements)}>
                        {showMeasurements ? '▲ Hide' : '▼ Add'} Body Measurements (optional)
                    </button>

                    {showMeasurements && (
                        <div className={styles.measurementGrid}>
                            {MEASUREMENTS.map(m => (
                                <div key={m.key} className="form-group">
                                    <label className="form-label" style={{ color: m.color }}>{m.label} (cm)</label>
                                    <input type="number" step="0.1" className="form-input" placeholder="0"
                                        value={form[m.key]} onChange={e => setForm({ ...form, [m.key]: e.target.value })} />
                                </div>
                            ))}
                        </div>
                    )}
                </form>
            </div>

            {/* Log History */}
            {logs.length > 0 && (
                <div className={styles.historyCard}>
                    <h2 className={styles.formTitle}>History</h2>
                    <div className={styles.historyList}>
                        {[...logs].reverse().map(log => (
                            <div key={log._id} className={styles.historyRow}>
                                <div>
                                    <div className={styles.historyDate}>{log.date}</div>
                                    <div className={styles.historyMeasurements}>
                                        {MEASUREMENTS.filter(m => log[m.key]).map(m => (
                                            <span key={m.key} className={styles.measureBadge} style={{ borderColor: m.color, color: m.color }}>
                                                {m.label}: {log[m.key]}cm
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.historyRight}>
                                    <span className={styles.historyWeight}>{log.weight} kg</span>
                                    <button className="btn-icon" onClick={() => handleDelete(log._id)}>
                                        <IoTrashOutline size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
