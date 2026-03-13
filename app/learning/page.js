'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    IoAdd, IoTrashOutline, IoPencilOutline, IoChevronDown, IoChevronUp,
    IoOpenOutline, IoTimeOutline, IoAddCircleOutline, IoBookOutline,
    IoHelpCircleOutline, IoBulbOutline, IoHappyOutline,
} from 'react-icons/io5';
import AddGoalModal from '@/components/AddGoalModal';
import EmptyState from '@/components/EmptyState';
import {
    getLearningGoals, addLearningGoal, updateLearningGoal, deleteLearningGoal,
    addProgressLog, deleteProgressLog,
} from '@/lib/storage';
import styles from './page.module.css';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];
const STATUS_BADGE = {
    'Not Started': 'badge badge-purple',
    'In Progress': 'badge badge-amber',
    'Completed': 'badge badge-emerald',
};
const MOOD_OPTIONS = [
    { value: 'great', label: '🔥 Great', color: 'var(--accent-emerald)' },
    { value: 'good', label: '😊 Good', color: 'var(--accent-cyan)' },
    { value: 'okay', label: '😐 Okay', color: 'var(--accent-amber)' },
    { value: 'struggling', label: '😤 Struggling', color: 'var(--accent-rose)' },
];

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const today = new Date().toISOString().split('T')[0];

export default function LearningPage() {
    const [goals, setGoals] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [expandedGoals, setExpandedGoals] = useState(new Set());
    const [mounted, setMounted] = useState(false);

    // Log form state
    const [logForm, setLogForm] = useState({
        whatLearned: '',
        doubts: '',
        keyTakeaways: '',
        timeSpent: '',
        mood: 'good',
        progress: '',
    });

    const loadGoals = useCallback(() => {
        setGoals(getLearningGoals());
    }, []);

    useEffect(() => {
        loadGoals();
        setMounted(true);
    }, [loadGoals]);

    if (!mounted) return null;

    const toggleExpand = (goalId) => {
        setExpandedGoals((prev) => {
            const next = new Set(prev);
            if (next.has(goalId)) next.delete(goalId);
            else next.add(goalId);
            return next;
        });
    };

    const handleAddGoal = (e) => {
        const fd = new FormData(e.target);
        const data = {
            title: fd.get('title'),
            resource: fd.get('resource') || '',
            progress: parseInt(fd.get('progress')) || 0,
            status: fd.get('status') || 'Not Started',
        };
        if (editingGoal) {
            updateLearningGoal(editingGoal.id, data);
        } else {
            addLearningGoal(data);
        }
        setModalOpen(false);
        setEditingGoal(null);
        loadGoals();
    };

    const handleDeleteGoal = (id) => { deleteLearningGoal(id); loadGoals(); };
    const handleEditGoal = (goal) => { setEditingGoal(goal); setModalOpen(true); };

    const openLogModal = (goalId) => {
        setSelectedGoalId(goalId);
        setLogForm({ whatLearned: '', doubts: '', keyTakeaways: '', timeSpent: '', mood: 'good', progress: '' });
        setLogModalOpen(true);
    };

    const handleAddLog = (e) => {
        e.preventDefault();
        if (!logForm.whatLearned.trim()) return;
        const logData = {
            whatLearned: logForm.whatLearned,
            doubts: logForm.doubts,
            keyTakeaways: logForm.keyTakeaways,
            timeSpent: logForm.timeSpent,
            mood: logForm.mood,
        };
        if (logForm.progress) {
            updateLearningGoal(selectedGoalId, { progress: parseInt(logForm.progress) });
        }
        addProgressLog(selectedGoalId, logData);
        setLogModalOpen(false);
        setSelectedGoalId(null);
        // Auto expand to show the log
        setExpandedGoals((prev) => new Set(prev).add(selectedGoalId));
        loadGoals();
    };

    const handleDeleteLog = (goalId, logId) => { deleteProgressLog(goalId, logId); loadGoals(); };

    const completed = goals.filter((g) => g.status === 'Completed').length;

    // Find today's logs across all goals
    const todaysLogs = [];
    goals.forEach((g) => {
        (g.progressLogs || []).forEach((log) => {
            if (log.date === today) {
                todaysLogs.push({ ...log, goalTitle: g.title, goalId: g.id });
            }
        });
    });

    const getMoodEmoji = (mood) => {
        const m = MOOD_OPTIONS.find((o) => o.value === mood);
        return m ? m.label : '😊 Good';
    };

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div className="page-header">
                    <h1 className="page-title">
                        <span className="page-title-gradient">📚 Learning Journal</span>
                    </h1>
                    <p className="page-subtitle">
                        {completed}/{goals.length} completed · Log what you learn every day
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingGoal(null); setModalOpen(true); }}>
                    <IoAdd size={20} /> New Goal
                </button>
            </div>

            {/* === TODAY'S ACTIVITY BANNER === */}
            {todaysLogs.length > 0 && (
                <div className={styles.todaySection}>
                    <h2 className="section-title">📝 Today&apos;s Learning</h2>
                    <div className={styles.todayCards}>
                        {todaysLogs.map((log) => (
                            <div key={log.id} className={styles.todayCard}>
                                <div className={styles.todayCardHeader}>
                                    <span className="badge badge-purple">{log.goalTitle}</span>
                                    <span className={styles.todayMood}>{getMoodEmoji(log.mood)}</span>
                                </div>
                                <div className={styles.todayLearned}>
                                    <IoBookOutline size={14} className={styles.todayIcon} />
                                    {log.whatLearned}
                                </div>
                                {log.doubts && (
                                    <div className={styles.todayDoubts}>
                                        <IoHelpCircleOutline size={14} className={styles.todayIcon} />
                                        <span className={styles.todayLabel}>Doubts:</span> {log.doubts}
                                    </div>
                                )}
                                {log.keyTakeaways && (
                                    <div className={styles.todayTakeaways}>
                                        <IoBulbOutline size={14} className={styles.todayIcon} />
                                        <span className={styles.todayLabel}>Key Takeaways:</span> {log.keyTakeaways}
                                    </div>
                                )}
                                {log.timeSpent && (
                                    <div className={styles.todayTime}>
                                        <IoTimeOutline size={14} /> {log.timeSpent}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* === GOALS === */}
            {goals.length === 0 ? (
                <EmptyState
                    title="No learning goals yet"
                    message="Add a course, topic, or skill — then log your daily learning with notes, doubts, and key takeaways!"
                    actionLabel="Add Learning Goal"
                    onAction={() => setModalOpen(true)}
                />
            ) : (
                <div className={styles.goalsList}>
                    {goals.map((goal) => {
                        const isExpanded = expandedGoals.has(goal.id);
                        const logs = goal.progressLogs || [];
                        return (
                            <div key={goal.id} className={styles.goalCard}>
                                <div className={styles.goalHeader}>
                                    <div className={styles.goalInfo}>
                                        <div className={styles.goalTitleRow}>
                                            <h3 className={styles.goalTitle}>{goal.title}</h3>
                                            <span className={STATUS_BADGE[goal.status]}>{goal.status}</span>
                                        </div>
                                        {goal.resource && (
                                            <a href={goal.resource} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                                                <IoOpenOutline size={14} /> Resource
                                            </a>
                                        )}
                                        <div className={styles.progressRow}>
                                            <div className="progress-bar-container" style={{ flex: 1 }}>
                                                <div className="progress-bar-fill" style={{ width: `${goal.progress || 0}%`, background: 'var(--gradient-learning)' }} />
                                            </div>
                                            <span className={styles.progressText}>{goal.progress || 0}%</span>
                                        </div>
                                    </div>
                                    <div className={styles.goalActions}>
                                        <button className="btn-ghost" onClick={() => openLogModal(goal.id)}>
                                            <IoAddCircleOutline size={16} /> Log Today
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEditGoal(goal)} title="Edit"><IoPencilOutline size={16} /></button>
                                        <button className="btn-icon" onClick={() => handleDeleteGoal(goal.id)} title="Delete"><IoTrashOutline size={16} /></button>
                                        {logs.length > 0 && (
                                            <button className="btn-icon" onClick={() => toggleExpand(goal.id)} title="Toggle logs">
                                                {isExpanded ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Logs Timeline */}
                                {isExpanded && logs.length > 0 && (
                                    <div className={styles.logsSection}>
                                        <div className="section-subtitle">{logs.length} journal entr{logs.length > 1 ? 'ies' : 'y'}</div>
                                        <div className={styles.logsList}>
                                            {logs.map((log) => (
                                                <div key={log.id} className={styles.logEntry}>
                                                    <div className={styles.logHeader}>
                                                        <span className={styles.logDate}>{formatDate(log.date)}</span>
                                                        <div className={styles.logMeta}>
                                                            {log.mood && <span className={styles.logMood}>{getMoodEmoji(log.mood)}</span>}
                                                            {log.timeSpent && <span className={styles.logTime}><IoTimeOutline size={12} /> {log.timeSpent}</span>}
                                                        </div>
                                                        <button className="btn-icon" onClick={() => handleDeleteLog(goal.id, log.id)} style={{ opacity: 0.4 }}><IoTrashOutline size={14} /></button>
                                                    </div>

                                                    <div className={styles.logBody}>
                                                        <div className={styles.logSection}>
                                                            <span className={styles.logSectionIcon}><IoBookOutline size={13} /></span>
                                                            <div>
                                                                <span className={styles.logSectionLabel}>What I learned</span>
                                                                <p className={styles.logSectionText}>{log.whatLearned || log.notes}</p>
                                                            </div>
                                                        </div>

                                                        {log.doubts && (
                                                            <div className={styles.logSection}>
                                                                <span className={`${styles.logSectionIcon} ${styles.iconDoubts}`}><IoHelpCircleOutline size={13} /></span>
                                                                <div>
                                                                    <span className={styles.logSectionLabel}>Doubts / Questions</span>
                                                                    <p className={styles.logSectionText}>{log.doubts}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {log.keyTakeaways && (
                                                            <div className={styles.logSection}>
                                                                <span className={`${styles.logSectionIcon} ${styles.iconTakeaways}`}><IoBulbOutline size={13} /></span>
                                                                <div>
                                                                    <span className={styles.logSectionLabel}>Key Takeaways</span>
                                                                    <p className={styles.logSectionText}>{log.keyTakeaways}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {logs.length > 0 && !isExpanded && (
                                    <button className={styles.showLogsBtn} onClick={() => toggleExpand(goal.id)}>
                                        View {logs.length} journal entr{logs.length > 1 ? 'ies' : 'y'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* === ADD/EDIT GOAL MODAL === */}
            <AddGoalModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditingGoal(null); }}
                title={editingGoal ? 'Edit Learning Goal' : 'New Learning Goal'}
                onSubmit={handleAddGoal}
            >
                <div className="form-group">
                    <label className="form-label">Topic / Course Title</label>
                    <input className="form-input" name="title" placeholder="e.g. React Advanced Patterns" defaultValue={editingGoal?.title || ''} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Resource Link (optional)</label>
                    <input className="form-input" name="resource" placeholder="https://..." defaultValue={editingGoal?.resource || ''} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                        <label className="form-label">Progress %</label>
                        <input className="form-input" name="progress" type="number" min="0" max="100" placeholder="0" defaultValue={editingGoal?.progress ?? ''} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" name="status" defaultValue={editingGoal?.status || 'Not Started'}>
                            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </AddGoalModal>

            {/* === LOG DAILY PROGRESS MODAL === */}
            {logModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setLogModalOpen(false); setSelectedGoalId(null); } }}>
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">📝 Daily Learning Log</h2>
                            <button className="modal-close" onClick={() => { setLogModalOpen(false); setSelectedGoalId(null); }}>×</button>
                        </div>
                        <form onSubmit={handleAddLog}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">✏️ What did you learn today?</label>
                                    <textarea
                                        className="form-textarea"
                                        value={logForm.whatLearned}
                                        onChange={(e) => setLogForm({ ...logForm, whatLearned: e.target.value })}
                                        placeholder="e.g. Learned about React useEffect cleanup, async patterns..."
                                        rows={3}
                                        required
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">❓ Doubts / Questions</label>
                                    <textarea
                                        className="form-textarea"
                                        value={logForm.doubts}
                                        onChange={(e) => setLogForm({ ...logForm, doubts: e.target.value })}
                                        placeholder="e.g. How does useEffect handle race conditions? When to use useLayoutEffect?"
                                        rows={2}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">💡 Key Takeaways</label>
                                    <textarea
                                        className="form-textarea"
                                        value={logForm.keyTakeaways}
                                        onChange={(e) => setLogForm({ ...logForm, keyTakeaways: e.target.value })}
                                        placeholder="e.g. Always clean up subscriptions in useEffect return function..."
                                        rows={2}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div className={styles.logFormGrid}>
                                    <div className="form-group">
                                        <label className="form-label">⏱️ Time Spent</label>
                                        <input
                                            className="form-input"
                                            value={logForm.timeSpent}
                                            onChange={(e) => setLogForm({ ...logForm, timeSpent: e.target.value })}
                                            placeholder="e.g. 2 hours"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">📊 Update Progress %</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={logForm.progress}
                                            onChange={(e) => setLogForm({ ...logForm, progress: e.target.value })}
                                            placeholder="Keep same"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">🧠 How did it go?</label>
                                        <select
                                            className="form-select"
                                            value={logForm.mood}
                                            onChange={(e) => setLogForm({ ...logForm, mood: e.target.value })}
                                        >
                                            {MOOD_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setLogModalOpen(false); setSelectedGoalId(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
