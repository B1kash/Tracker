'use client';

import { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoTrashOutline, IoPencilOutline, IoClose, IoCheckmarkCircle, IoEllipseOutline, IoCalendarOutline } from 'react-icons/io5';
import AddGoalModal from '@/components/AddGoalModal';
import EmptyState from '@/components/EmptyState';
import {
    getContentLogs,
    getContentByDate,
    addContentLog,
    updateContentLog,
    deleteContentLog,
} from '@/lib/storage';
import styles from './page.module.css';

const STATUSES = ['Created', 'Drafted', 'Posted'];
const PLATFORMS = ['YouTube', 'Blog', 'Twitter', 'Instagram', 'LinkedIn', 'TikTok', 'Other'];

const STATUS_BADGE = {
    Created: 'badge badge-amber',
    Drafted: 'badge badge-cyan',
    Posted: 'badge badge-emerald',
};

const PLATFORM_BADGE = {
    YouTube: 'badge badge-rose',
    Blog: 'badge badge-purple',
    Twitter: 'badge badge-cyan',
    Instagram: 'badge badge-amber',
    LinkedIn: 'badge badge-indigo',
    TikTok: 'badge badge-rose',
    Other: 'badge badge-purple',
};

function getDateStr(date) {
    return date.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ContentPage() {
    const [logs, setLogs] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [mounted, setMounted] = useState(false);

    const today = getDateStr(new Date());

    const loadData = useCallback(() => {
        setLogs(getContentLogs());
    }, []);

    useEffect(() => {
        loadData();
        setMounted(true);
    }, [loadData]);

    if (!mounted) return null;

    const handleAdd = (e) => {
        const fd = new FormData(e.target);
        const data = {
            title: fd.get('title'),
            platform: fd.get('platform') || 'Blog',
            status: fd.get('status') || 'Created',
            date: fd.get('date') || today,
            notes: fd.get('notes') || '',
        };
        if (editingLog) {
            updateContentLog(editingLog.id, data);
        } else {
            addContentLog(data);
        }
        setModalOpen(false);
        setEditingLog(null);
        loadData();
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        setModalOpen(true);
    };

    const handleDelete = (id) => {
        deleteContentLog(id);
        loadData();
    };

    const handleStatusToggle = (log) => {
        const currentIdx = STATUSES.indexOf(log.status);
        const nextStatus = STATUSES[(currentIdx + 1) % STATUSES.length];
        updateContentLog(log.id, { status: nextStatus });
        loadData();
    };

    // Group by date
    const logsByDate = {};
    logs.forEach((l) => {
        const key = l.date || today;
        if (!logsByDate[key]) logsByDate[key] = [];
        logsByDate[key].push(l);
    });

    const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));
    const todayLogs = logsByDate[today] || [];
    const posted = logs.filter((l) => l.status === 'Posted').length;

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div className="page-header">
                    <h1 className="page-title">
                        <span className="page-title-gradient">🎬 Content Creation</span>
                    </h1>
                    <p className="page-subtitle">
                        {posted}/{logs.length} posted · Track what you create, draft, and publish
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingLog(null); setModalOpen(true); }}>
                    <IoAdd size={20} /> Log Content
                </button>
            </div>

            {/* Today's Banner */}
            {todayLogs.length > 0 && (
                <div className="today-banner">
                    <div>
                        <div className="today-banner-date">Today&apos;s Activity</div>
                        <div className="today-banner-text">{todayLogs.length} content piece{todayLogs.length > 1 ? 's' : ''} logged today</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {todayLogs.filter(l => l.status === 'Posted').length > 0 && (
                            <span className="badge badge-emerald">
                                {todayLogs.filter(l => l.status === 'Posted').length} Posted
                            </span>
                        )}
                        {todayLogs.filter(l => l.status === 'Created').length > 0 && (
                            <span className="badge badge-amber">
                                {todayLogs.filter(l => l.status === 'Created').length} Created
                            </span>
                        )}
                    </div>
                </div>
            )}

            {logs.length === 0 ? (
                <EmptyState
                    title="No content logged yet"
                    message="Start logging your content — track ideas, drafts, and published work across platforms!"
                    actionLabel="Log Content"
                    onAction={() => setModalOpen(true)}
                />
            ) : (
                <div className={styles.dateGroups}>
                    {sortedDates.map((dateKey) => (
                        <div key={dateKey} className={styles.dateGroup}>
                            <div className={styles.dateHeader}>
                                <IoCalendarOutline size={16} />
                                <span>{dateKey === today ? 'Today' : formatDate(dateKey)}</span>
                                <span className={styles.dateBadge}>{logsByDate[dateKey].length}</span>
                            </div>
                            <div className={styles.contentList}>
                                {logsByDate[dateKey].map((log) => (
                                    <div key={log.id} className="content-card">
                                        <button
                                            className={styles.statusBtn}
                                            onClick={() => handleStatusToggle(log)}
                                            title={`Click to change status (${log.status})`}
                                        >
                                            {log.status === 'Posted' ? (
                                                <IoCheckmarkCircle size={22} style={{ color: 'var(--accent-emerald)' }} />
                                            ) : (
                                                <IoEllipseOutline size={22} style={{ color: 'var(--text-muted)' }} />
                                            )}
                                        </button>
                                        <div className={styles.contentInfo}>
                                            <div className={styles.contentTitle}>{log.title}</div>
                                            <div className={styles.contentMeta}>
                                                <span className={PLATFORM_BADGE[log.platform] || 'badge badge-purple'}>{log.platform}</span>
                                                <span className={STATUS_BADGE[log.status]}>{log.status}</span>
                                            </div>
                                            {log.notes && <p className={styles.contentNotes}>{log.notes}</p>}
                                        </div>
                                        <div className={styles.contentActions}>
                                            <button className="btn-icon" onClick={() => handleEdit(log)}>
                                                <IoPencilOutline size={16} />
                                            </button>
                                            <button className="btn-icon" onClick={() => handleDelete(log.id)}>
                                                <IoTrashOutline size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AddGoalModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingLog(null); }}
                title={editingLog ? 'Edit Content Log' : 'Log New Content'}
                onSubmit={handleAdd}
            >
                <div className="form-group">
                    <label className="form-label">Content Title</label>
                    <input className="form-input" name="title" placeholder="e.g. How to Build APIs" defaultValue={editingLog?.title || ''} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                        <label className="form-label">Platform</label>
                        <select className="form-select" name="platform" defaultValue={editingLog?.platform || 'Blog'}>
                            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" name="status" defaultValue={editingLog?.status || 'Created'}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" name="date" type="date" defaultValue={editingLog?.date || today} />
                </div>
                <div className="form-group">
                    <label className="form-label">Notes (optional)</label>
                    <textarea className="form-textarea" name="notes" placeholder="Key points, links, etc." rows={3} defaultValue={editingLog?.notes || ''} style={{ resize: 'vertical' }} />
                </div>
            </AddGoalModal>
        </div>
    );
}
