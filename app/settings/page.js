'use client';

import { useState, useEffect } from 'react';
import { IoDownloadOutline, IoPersonOutline, IoShieldCheckmarkOutline, IoTrashOutline, IoNotificationsOutline, IoTimeOutline } from 'react-icons/io5';
import { getPushPublicKey, getPushSettings, updatePushSettings, subscribeToPush } from '@/lib/storage';
import styles from './page.module.css';

async function apiCall(endpoint, method = 'GET', body = null) {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('jwt_token');
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    };
    if (body) config.body = JSON.stringify(body);
    const res = await fetch(`http://localhost:5000/api${endpoint}`, config);
    return res;
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function SettingsPage() {
    const [exporting, setExporting] = useState(false);
    const [msg, setMsg] = useState('');
    const username = typeof window !== 'undefined' ? localStorage.getItem('username') || 'User' : 'User';

    const [pushEnabled, setPushEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('08:00');

    useEffect(() => {
        async function load() {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                const sub = await reg?.pushManager.getSubscription();
                setPushEnabled(!!sub);
            }
            const settings = await getPushSettings();
            if (settings) {
                setReminderTime(settings.habitReminderTime || '08:00');
            }
        }
        load();
    }, []);

    const showMsg = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(''), 3000);
    };

    const handleEnablePush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            showMsg('❌ Push notifications not supported by your browser.');
            return;
        }

        try {
            const reg = await navigator.serviceWorker.ready;
            const publicKey = await getPushPublicKey();
            
            // Convert base64 VAPID string to Uint8Array
            const padding = '='.repeat((4 - publicKey.length % 4) % 4);
            const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }

            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: outputArray
            });

            await subscribeToPush(subscription);
            setPushEnabled(true);
            showMsg('✅ Notifications enabled!');
        } catch (e) {
            console.error(e);
            showMsg('❌ Failed to enable notifications. Please allow permissions.');
        }
    };

    const handleSaveReminderTime = async () => {
        await updatePushSettings({ habitReminderTime: reminderTime });
        showMsg('✅ Reminder time updated!');
    };

    const exportWorkoutsCSV = async () => {
        setExporting(true);
        try {
            const res = await apiCall('/gym/workouts');
            const workouts = await res.json();

            const rows = [['Date', 'Exercise', 'Set', 'Reps', 'Weight', 'Completed']];
            for (const w of workouts) {
                for (const ex of w.exercises || []) {
                    ex.sets.forEach((set, idx) => {
                        rows.push([w.date, ex.name, idx + 1, set.reps || 0, set.weight || '', set.completed ? 'Yes' : 'No']);
                    });
                }
            }

            const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
            downloadFile(csv, `gym_workouts_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
            showMsg('✅ Workout CSV downloaded!');
        } catch (e) {
            showMsg('❌ Export failed. Make sure you are logged in.');
        }
        setExporting(false);
    };

    const exportAllJSON = async () => {
        setExporting(true);
        try {
            const [workoutsRes, habitsRes, gamRes] = await Promise.all([
                apiCall('/gym/workouts'),
                apiCall('/habits'),
                apiCall('/gamification'),
            ]);

            const data = {
                exportedAt: new Date().toISOString(),
                user: username,
                gamification: await gamRes.json(),
                workouts: await workoutsRes.json(),
                habits: await habitsRes.json(),
            };

            downloadFile(JSON.stringify(data, null, 2), `life_tracker_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
            showMsg('✅ Full JSON export downloaded!');
        } catch (e) {
            showMsg('❌ Export failed. Make sure you are logged in.');
        }
        setExporting(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        window.location.reload();
    };

    return (
        <div className={styles.page}>
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-title-gradient">⚙️ Settings</span>
                </h1>
                <p className="page-subtitle">Manage your account and export your data</p>
            </div>

            {msg && <div className={styles.toast}>{msg}</div>}

            {/* Profile section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <IoPersonOutline size={18} />
                    <h2 className={styles.sectionTitle}>Profile</h2>
                </div>
                <div className={styles.card}>
                    <div className={styles.profileRow}>
                        <div className={styles.avatar}>{username[0]?.toUpperCase()}</div>
                        <div>
                            <div className={styles.profileName}>{username}</div>
                            <div className={styles.profileSub}>Life Tracker Member</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Export section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <IoDownloadOutline size={18} />
                    <h2 className={styles.sectionTitle}>Data Export</h2>
                </div>
                <div className={styles.card}>
                    <p className={styles.description}>Download your data for backup or analysis in other tools.</p>
                    <div className={styles.exportButtons}>
                        <button className={`btn btn-primary ${styles.exportBtn}`} onClick={exportWorkoutsCSV} disabled={exporting}>
                            <IoDownloadOutline size={16} />
                            Export Gym Workouts (.CSV)
                        </button>
                        <button className={`btn ${styles.exportBtnSecondary}`} onClick={exportAllJSON} disabled={exporting}>
                            <IoDownloadOutline size={16} />
                            Export All Data (.JSON)
                        </button>
                    </div>
                </div>
            </div>
            {/* Notifications Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <IoNotificationsOutline size={18} style={{ color: 'var(--accent-purple)' }} />
                    <h2 className={styles.sectionTitle}>Notifications</h2>
                </div>
                <div className={styles.card}>
                    <p className={styles.description}>Stay on track with daily habit reminders and gym alerts.</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Push Notifications</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pushEnabled ? 'Enabled on this device' : 'Disabled on this device'}</div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleEnablePush} disabled={pushEnabled}>
                            {pushEnabled ? 'Enabled' : 'Enable'}
                        </button>
                    </div>

                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IoTimeOutline size={16} /> Daily Habit Reminder
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="time" 
                                className="form-input" 
                                value={reminderTime} 
                                onChange={(e) => setReminderTime(e.target.value)} 
                                style={{ maxWidth: '150px' }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleSaveReminderTime}>Save Time</button>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                            You will receive a notification at this time if you have uncompleted habits.
                        </div>
                    </div>
                </div>
            </div>
            {/* Danger Zone */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <IoTrashOutline size={18} style={{ color: '#f43f5e' }} />
                    <h2 className={styles.sectionTitle} style={{ color: '#f43f5e' }}>Account</h2>
                </div>
                <div className={`${styles.card} ${styles.dangerCard}`}>
                    <p className={styles.description}>Log out of your account on this device.</p>
                    <button className={styles.dangerBtn} onClick={handleLogout}>
                        <IoShieldCheckmarkOutline size={16} />
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
