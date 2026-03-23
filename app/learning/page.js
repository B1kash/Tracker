'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    IoAdd, IoTrashOutline, IoPencilOutline, IoChevronDown, IoChevronUp,
    IoOpenOutline, IoTimeOutline, IoAddCircleOutline, IoBookOutline,
    IoHelpCircleOutline, IoBulbOutline,
} from 'react-icons/io5';
import EmptyState from '@/components/EmptyState';
import {
    getLearningGoals, addLearningGoal, updateLearningGoal, deleteLearningGoal,
    addProgressLog, deleteProgressLog, generateCurriculumWithAI
} from '@/lib/storage';
import styles from './page.module.css';

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];
const STATUS_BADGE = {
    'Not Started': 'badge badge-purple',
    'In Progress': 'badge badge-amber',
    'Completed': 'badge badge-emerald',
};
const MOOD_OPTIONS = [
    { value: 'great', label: '🔥 Great' },
    { value: 'good', label: '😊 Good' },
    { value: 'okay', label: '😐 Okay' },
    { value: 'struggling', label: '😤 Struggling' },
];

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const today = new Date().toISOString().split('T')[0];

export default function LearningPage() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [expandedGoals, setExpandedGoals] = useState(new Set());
    const [goalForm, setGoalForm] = useState({ title: '', resource: '', progress: 0, status: 'Not Started' });
    const [logForm, setLogForm] = useState({ whatLearned: '', doubts: '', keyTakeaways: '', timeSpent: '', mood: 'good', progress: '' });

    // AI States
    const [aiTopic, setAiTopic] = useState('');
    const [generatingCurriculum, setGeneratingCurriculum] = useState(false);

    const loadGoals = useCallback(async () => {
        setLoading(true);
        const data = await getLearningGoals();
        setGoals(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadGoals(); }, [loadGoals]);

    const toggleExpand = (goalId) => {
        setExpandedGoals((prev) => {
            const next = new Set(prev);
            if (next.has(goalId)) next.delete(goalId); else next.add(goalId);
            return next;
        });
    };

    const openEditModal = (goal) => {
        setEditingGoal(goal);
        setGoalForm({ title: goal.title, resource: goal.resource || '', progress: goal.progress || 0, status: goal.status || 'Not Started' });
        setModalOpen(true);
    };

    const handleSaveGoal = async (e) => {
        e.preventDefault();
        if (editingGoal) {
            await updateLearningGoal(editingGoal._id || editingGoal.id, goalForm);
        } else {
            await addLearningGoal(goalForm);
        }
        setModalOpen(false);
        setEditingGoal(null);
        setGoalForm({ title: '', resource: '', progress: 0, status: 'Not Started' });
        loadGoals();
    };

    const handleGenerateCurriculum = async (e) => {
        e.preventDefault();
        if (!aiTopic.trim()) return;
        setGeneratingCurriculum(true);
        try {
            const res = await generateCurriculumWithAI(aiTopic);
            const steps = res.steps || [];
            if (steps.length > 0) {
                // Create a master goal
                const payload = { title: `AI: ${aiTopic}`, resource: 'Curriculum from Oracle ✨', progress: 0, status: 'Not Started' };
                const newGoal = await addLearningGoal(payload);
                // Add the curriculum as the first log
                await addProgressLog(newGoal._id || newGoal.id, {
                    whatLearned: 'Syllabus successfully generated!\n\n' + steps.join('\n\n'),
                    mood: 'great'
                });
                setAiTopic('');
                loadGoals();
                alert('Curriculum generated! Check the new Course log.');
            }
        } catch (e) {
            alert('Failed to generate curriculum.');
        }
        setGeneratingCurriculum(false);
    };

    const handleDeleteGoal = async (id) => {
        if (!confirm('Delete this learning goal and all its logs?')) return;
        await deleteLearningGoal(id);
        loadGoals();
    };

    const openLogModal = (goalId) => {
        setSelectedGoalId(goalId);
        setLogForm({ whatLearned: '', doubts: '', keyTakeaways: '', timeSpent: '', mood: 'good', progress: '' });
        setLogModalOpen(true);
    };

    const handleAddLog = async (e) => {
        e.preventDefault();
        if (!logForm.whatLearned.trim()) return;
        await addProgressLog(selectedGoalId, {
            whatLearned: logForm.whatLearned,
            doubts: logForm.doubts,
            keyTakeaways: logForm.keyTakeaways,
            timeSpent: logForm.timeSpent,
            mood: logForm.mood,
            progress: logForm.progress ? parseInt(logForm.progress) : undefined,
        });
        setLogModalOpen(false);
        setSelectedGoalId(null);
        setExpandedGoals((prev) => new Set(prev).add(selectedGoalId));
        loadGoals();
    };

    const handleDeleteLog = async (goalId, logId) => {
        await deleteProgressLog(goalId, logId);
        loadGoals();
    };

    const getMoodEmoji = (mood) => MOOD_OPTIONS.find((o) => o.value === mood)?.label || '😊 Good';

    const completed = goals.filter((g) => g.status === 'Completed').length;
    const todaysLogs = [];
    goals.forEach((g) => {
        (g.progressLogs || []).forEach((log) => {
            const logDate = (log.date || '').split('T')[0];
            if (logDate === today) todaysLogs.push({ ...log, goalTitle: g.title, goalId: g._id || g.id });
        });
    });

    return (
        <div className={styles.page}>
            <div className={styles.headerRow}>
                <div className="page-header">
                    <h1 className="page-title">
                        <span className="page-title-gradient">📚 Learning Journal</span>
                    </h1>
                    <p className="page-subtitle">
                        {loaded => completed}/{goals.length} completed · Log what you learn every day
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingGoal(null); setGoalForm({ title: '', resource: '', progress: 0, status: 'Not Started' }); setModalOpen(true); }}>
                    <IoAdd size={20} /> New Goal
                </button>
            </div>

            <form onSubmit={handleGenerateCurriculum} style={{ background: 'linear-gradient(135deg, var(--bg-card), #1e1526)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid var(--accent-purple)', display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>✨</span>
                <input className="form-input" placeholder="AI Oracle: What do you want to learn? (e.g. 'Advanced React')" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} disabled={generatingCurriculum || loading} style={{ flex: 1, border: 'none', background: 'transparent' }} required />
                <button type="submit" className="btn btn-sm" disabled={generatingCurriculum || !aiTopic} style={{ background: 'var(--accent-purple)', color: 'white', border: 'none' }}>
                    {generatingCurriculum ? 'Generating...' : 'Build Curriculum'}
                </button>
            </form>

            {todaysLogs.length > 0 && (
                <div className={styles.todaySection}>
                    <h2 className="section-title">📝 Today&apos;s Learning</h2>
                    <div className={styles.todayCards}>
                        {todaysLogs.map((log) => (
                            <div key={log._id || log.id} className={styles.todayCard}>
                                <div className={styles.todayCardHeader}>
                                    <span className="badge badge-purple">{log.goalTitle}</span>
                                    <span className={styles.todayMood}>{getMoodEmoji(log.mood)}</span>
                                </div>
                                <div className={styles.todayLearned}>
                                    <IoBookOutline size={14} className={styles.todayIcon} />
                                    {log.whatLearned}
                                </div>
                                {log.timeSpent && <div className={styles.todayTime}><IoTimeOutline size={14} /> {log.timeSpent}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <p style={{ color: 'var(--text-muted)', padding: '40px' }}>Loading...</p>
            ) : goals.length === 0 ? (
                <EmptyState
                    title="No learning goals yet"
                    message="Add a course, topic, or skill — then log your daily learning!"
                    actionLabel="Add Learning Goal"
                    onAction={() => setModalOpen(true)}
                />
            ) : (
                <div className={styles.goalsList}>
                    {goals.map((goal) => {
                        const goalId = goal._id || goal.id;
                        const isExpanded = expandedGoals.has(goalId);
                        const logs = goal.progressLogs || [];
                        return (
                            <div key={goalId} className={styles.goalCard}>
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
                                        <button className="btn-ghost" onClick={() => openLogModal(goalId)}>
                                            <IoAddCircleOutline size={16} /> Log Today
                                        </button>
                                        <button className="btn-icon" onClick={() => openEditModal(goal)} title="Edit"><IoPencilOutline size={16} /></button>
                                        <button className="btn-icon" onClick={() => handleDeleteGoal(goalId)} title="Delete"><IoTrashOutline size={16} /></button>
                                        {logs.length > 0 && (
                                            <button className="btn-icon" onClick={() => toggleExpand(goalId)}>
                                                {isExpanded ? <IoChevronUp size={18} /> : <IoChevronDown size={18} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isExpanded && logs.length > 0 && (
                                    <div className={styles.logsSection}>
                                        <div className="section-subtitle">{logs.length} journal entr{logs.length > 1 ? 'ies' : 'y'}</div>
                                        <div className={styles.logsList}>
                                            {logs.map((log) => {
                                                const logId = log._id || log.id;
                                                return (
                                                    <div key={logId} className={styles.logEntry}>
                                                        <div className={styles.logHeader}>
                                                            <span className={styles.logDate}>{formatDate((log.date || '').split('T')[0])}</span>
                                                            <div className={styles.logMeta}>
                                                                {log.mood && <span className={styles.logMood}>{getMoodEmoji(log.mood)}</span>}
                                                                {log.timeSpent && <span className={styles.logTime}><IoTimeOutline size={12} /> {log.timeSpent}</span>}
                                                            </div>
                                                            <button className="btn-icon" onClick={() => handleDeleteLog(goalId, logId)} style={{ opacity: 0.4 }}><IoTrashOutline size={14} /></button>
                                                        </div>
                                                        <div className={styles.logBody}>
                                                            <div className={styles.logSection}>
                                                                <span className={styles.logSectionIcon}><IoBookOutline size={13} /></span>
                                                                <div>
                                                                    <span className={styles.logSectionLabel}>What I learned</span>
                                                                    <p className={styles.logSectionText}>{log.whatLearned}</p>
                                                                </div>
                                                            </div>
                                                            {log.doubts && (
                                                                <div className={styles.logSection}>
                                                                    <span className={`${styles.logSectionIcon} ${styles.iconDoubts}`}><IoHelpCircleOutline size={13} /></span>
                                                                    <div>
                                                                        <span className={styles.logSectionLabel}>Doubts</span>
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
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {logs.length > 0 && !isExpanded && (
                                    <button className={styles.showLogsBtn} onClick={() => toggleExpand(goalId)}>
                                        View {logs.length} journal entr{logs.length > 1 ? 'ies' : 'y'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ADD/EDIT GOAL MODAL */}
            {modalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingGoal ? 'Edit Learning Goal' : 'New Learning Goal'}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveGoal}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Topic / Course Title</label>
                                    <input className="form-input" value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. React Advanced Patterns" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Resource Link (optional)</label>
                                    <input className="form-input" value={goalForm.resource} onChange={e => setGoalForm(f => ({ ...f, resource: e.target.value }))} placeholder="https://..." />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Progress %</label>
                                        <input className="form-input" type="number" min="0" max="100" value={goalForm.progress} onChange={e => setGoalForm(f => ({ ...f, progress: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={goalForm.status} onChange={e => setGoalForm(f => ({ ...f, status: e.target.value }))}>
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Goal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LOG DAILY PROGRESS MODAL */}
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
                                    <label className="form-label">✏️ What did you learn today? *</label>
                                    <textarea className="form-textarea" value={logForm.whatLearned} onChange={e => setLogForm(f => ({ ...f, whatLearned: e.target.value }))} placeholder="e.g. Learned about React useEffect cleanup..." rows={3} required style={{ resize: 'vertical' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">❓ Doubts / Questions</label>
                                    <textarea className="form-textarea" value={logForm.doubts} onChange={e => setLogForm(f => ({ ...f, doubts: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">💡 Key Takeaways</label>
                                    <textarea className="form-textarea" value={logForm.keyTakeaways} onChange={e => setLogForm(f => ({ ...f, keyTakeaways: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
                                </div>
                                <div className={styles.logFormGrid}>
                                    <div className="form-group">
                                        <label className="form-label">⏱️ Time Spent</label>
                                        <input className="form-input" value={logForm.timeSpent} onChange={e => setLogForm(f => ({ ...f, timeSpent: e.target.value }))} placeholder="e.g. 2 hours" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">📊 Update Progress %</label>
                                        <input className="form-input" type="number" min="0" max="100" value={logForm.progress} onChange={e => setLogForm(f => ({ ...f, progress: e.target.value }))} placeholder="Keep same" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">🧠 How did it go?</label>
                                        <select className="form-select" value={logForm.mood} onChange={e => setLogForm(f => ({ ...f, mood: e.target.value }))}>
                                            {MOOD_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
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
