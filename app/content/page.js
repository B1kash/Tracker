'use client';

import { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoTrashOutline, IoPencilOutline, IoCheckmarkCircle, IoEllipseOutline, IoCalendarOutline } from 'react-icons/io5';
import EmptyState from '@/components/EmptyState';
import { getContentLogs, addContentLog, updateContentLog, deleteContentLog } from '@/lib/storage';
import styles from './page.module.css';

const STATUSES = ['Created', 'Drafted', 'Posted'];
const PLATFORMS = ['YouTube', 'Blog', 'Twitter', 'Instagram', 'LinkedIn', 'TikTok', 'Other'];
const STATUS_BADGE = { Created: 'badge badge-amber', Drafted: 'badge badge-cyan', Posted: 'badge badge-emerald' };
const PLATFORM_BADGE = { YouTube: 'badge badge-rose', Blog: 'badge badge-purple', Twitter: 'badge badge-cyan', Instagram: 'badge badge-amber', LinkedIn: 'badge badge-indigo', TikTok: 'badge badge-rose', Other: 'badge badge-purple' };

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ContentPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [form, setForm] = useState({ title: '', platform: 'Blog', status: 'Created', date: '', notes: '' });

    const today = new Date().toISOString().split('T')[0];

    const loadData = useCallback(async () => {
        setLoading(true);
        const data = await getContentLogs();
        setLogs(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openAdd = () => {
        setEditingLog(null);
        setForm({ title: '', platform: 'Blog', status: 'Created', date: today, notes: '' });
        setModalOpen(true);
    };

    const openEdit = (log) => {
        setEditingLog(log);
        setForm({ title: log.title, platform: log.platform, status: log.status, date: log.date, notes: log.notes || '' });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title) return;
        if (editingLog) {
            await updateContentLog(editingLog._id || editingLog.id, form);
        } else {
            await addContentLog(form);
        }
        setModalOpen(false);
        setEditingLog(null);
        loadData();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this content log?')) return;
        await deleteContentLog(id);
        setLogs(l => l.filter(x => (x._id || x.id) !== id));
    };

    const handleStatusToggle = async (log) => {
        const id = log._id || log.id;
        const currentIdx = STATUSES.indexOf(log.status);
        const nextStatus = STATUSES[(currentIdx + 1) % STATUSES.length];
        await updateContentLog(id, { status: nextStatus });
        setLogs(l => l.map(x => (x._id || x.id) === id ? { ...x, status: nextStatus } : x));
    };

    // Group by date
    const logsByDate = {};
    logs.forEach(l => {
        const key = l.date || today;
        if (!logsByDate[key]) logsByDate[key] = [];
        logsByDate[key].push(l);
    });
    const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));
    const todayLogs = logsByDate[today] || [];
    const posted = logs.filter(l => l.status === 'Posted').length;

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div className="page-header">
                    <h1 className="page-title"><span className="page-title-gradient">🎬 Content Creation</span></h1>
                    <p className="page-subtitle">{posted}/{logs.length} posted · Track what you create, draft, and publish</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><IoAdd size={20} /> Log Content</button>
            </div>

            {todayLogs.length > 0 && (
                <div className="today-banner">
                    <div>
                        <div className="today-banner-date">Today&apos;s Activity</div>
                        <div className="today-banner-text">{todayLogs.length} content piece{todayLogs.length > 1 ? 's' : ''} logged today</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {todayLogs.filter(l => l.status === 'Posted').length > 0 && <span className="badge badge-emerald">{todayLogs.filter(l => l.status === 'Posted').length} Posted</span>}
                        {todayLogs.filter(l => l.status === 'Created').length > 0 && <span className="badge badge-amber">{todayLogs.filter(l => l.status === 'Created').length} Created</span>}
                    </div>
                </div>
            )}

            {loading ? (
                <p style={{ color: 'var(--text-muted)', padding: '40px' }}>Loading...</p>
            ) : logs.length === 0 ? (
                <EmptyState title="No content logged yet" message="Start logging your content — track ideas, drafts, and published work!" actionLabel="Log Content" onAction={openAdd} />
            ) : (
                <div className={styles.dateGroups}>
                    {sortedDates.map(dateKey => (
                        <div key={dateKey} className={styles.dateGroup}>
                            <div className={styles.dateHeader}>
                                <IoCalendarOutline size={16} />
                                <span>{dateKey === today ? 'Today' : formatDate(dateKey)}</span>
                                <span className={styles.dateBadge}>{logsByDate[dateKey].length}</span>
                            </div>
                            <div className={styles.contentList}>
                                {logsByDate[dateKey].map(log => {
                                    const logId = log._id || log.id;
                                    return (
                                        <div key={logId} className="content-card">
                                            <button className={styles.statusBtn} onClick={() => handleStatusToggle(log)} title={`Status: ${log.status}`}>
                                                {log.status === 'Posted' ? <IoCheckmarkCircle size={22} style={{ color: 'var(--accent-emerald)' }} /> : <IoEllipseOutline size={22} style={{ color: 'var(--text-muted)' }} />}
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
                                                <button className="btn-icon" onClick={() => openEdit(log)}><IoPencilOutline size={16} /></button>
                                                <button className="btn-icon" onClick={() => handleDelete(logId)}><IoTrashOutline size={16} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ADD/EDIT MODAL */}
            {modalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingLog ? 'Edit Content Log' : 'Log New Content'}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Content Title</label>
                                    <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. How to Build APIs" required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Platform</label>
                                        <select className="form-select" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
