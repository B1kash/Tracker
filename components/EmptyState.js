'use client';

import { IoRocketOutline } from 'react-icons/io5';
import styles from './EmptyState.module.css';

export default function EmptyState({ title, message, actionLabel, onAction }) {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <IoRocketOutline size={48} />
            </div>
            <h3 className={styles.title}>{title || 'No goals yet'}</h3>
            <p className={styles.message}>{message || 'Start by adding your first goal to track your progress!'}</p>
            {actionLabel && onAction && (
                <button className="btn btn-primary" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
