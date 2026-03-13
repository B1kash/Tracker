'use client';

import { IoTrashOutline, IoPencilOutline, IoCheckmarkCircle, IoEllipseOutline } from 'react-icons/io5';
import styles from './GoalCard.module.css';

export default function GoalCard({ goal, category, onEdit, onDelete, onToggle, children }) {
    const getCategoryGradient = () => {
        switch (category) {
            case 'gym': return 'var(--gradient-gym)';
            case 'learning': return 'var(--gradient-learning)';
            case 'content': return 'var(--gradient-content)';
            default: return 'var(--gradient-primary)';
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardAccent} style={{ background: getCategoryGradient() }} />
            <div className={styles.cardHeader}>
                <div className={styles.titleRow}>
                    {onToggle && (
                        <button className={styles.checkBtn} onClick={() => onToggle(goal.id)}>
                            {goal.completed ? (
                                <IoCheckmarkCircle size={22} className={styles.checked} />
                            ) : (
                                <IoEllipseOutline size={22} className={styles.unchecked} />
                            )}
                        </button>
                    )}
                    <h3 className={`${styles.title} ${goal.completed ? styles.completedTitle : ''}`}>
                        {goal.title || goal.exercise}
                    </h3>
                </div>
                <div className={styles.actions}>
                    {onEdit && (
                        <button className="btn-icon" onClick={() => onEdit(goal)} title="Edit">
                            <IoPencilOutline size={18} />
                        </button>
                    )}
                    {onDelete && (
                        <button className="btn-icon" onClick={() => onDelete(goal.id)} title="Delete">
                            <IoTrashOutline size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.cardBody}>
                {children}
            </div>

            {goal.progress !== undefined && (
                <div className={styles.progressWrapper}>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${goal.progress}%`, background: getCategoryGradient() }}
                        />
                    </div>
                    <span className={styles.progressText}>{goal.progress}%</span>
                </div>
            )}
        </div>
    );
}
