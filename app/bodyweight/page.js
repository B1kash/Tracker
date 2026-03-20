'use client';

import { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoTrashOutline, IoScaleOutline, IoBarbell, IoTrendingUpOutline } from 'react-icons/io5';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getBodyWeightLogs, upsertBodyWeight, deleteBodyWeight } from '@/lib/storage';
import styles from './page.module.css';

const MEASUREMENTS = [
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
    const [form, setForm] = useState({
        date: getToday(),
        weight: '',
        chest: '', waist: '', arms: '', hips: '', thighs: '',
        notes: ''
    });
    const [showMeasurements, setShowMeasurements] = useState(false);

    const fetchLogs = useCallback(async () => {
        const data = await getBodyWeightLogs();
        setLogs(data);
        setMounted(true);
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.weight) return;
        setSaving(true);
        const payload = {};
        Object.entries(form).forEach(([k, v]) => {
            if (v !== '') payload[k] = ['weight', 'chest', 'waist', 'arms', 'hips', 'thighs'].includes(k) ? parseFloat(v) : v;
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
    const chartData = [...logs].sort((a, b) => a.date.localeCompare(b.date)).map(l => ({
        date: l.date,
        ...l
    }));

    const latest = logs.length > 0 ? logs[logs.length - 1] : null;
    const earliest = logs.length > 1 ? logs[0] : null;
    const weightDiff = latest && earliest
        ? (parseFloat(latest.weight) - parseFloat(earliest.weight)).toFixed(1)
        : null;

    return (
        <div className={styles.page}>
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-title-gradient">⚖️ Body Weight</span>
                </h1>
                <p className="page-subtitle">Track your weight and body measurements over time</p>
            </div>

            {/* Summary cards */}
            {latest && (
                <div className={styles.summaryRow}>
                    <div className={styles.summaryCard}>
                        <IoScaleOutline size={20} style={{ color: '#8b5cf6' }} />
                        <div>
                            <div className={styles.summaryValue}>{latest.weight} kg</div>
                            <div className={styles.summaryLabel}>Current Weight</div>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <IoTrendingUpOutline size={20} style={{ color: weightDiff > 0 ? '#f43f5e' : '#10b981' }} />
                        <div>
                            <div className={styles.summaryValue} style={{ color: weightDiff > 0 ? '#f43f5e' : '#10b981' }}>
                                {weightDiff !== null ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` : '—'}
                            </div>
                            <div className={styles.summaryLabel}>Total Change</div>
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <IoBarbell size={20} style={{ color: '#f59e0b' }} />
                        <div>
                            <div className={styles.summaryValue}>{logs.length}</div>
                            <div className={styles.summaryLabel}>Entries Logged</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart */}
            {chartData.length >= 2 && (
                <div className={styles.chartCard}>
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
