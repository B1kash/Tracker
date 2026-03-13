'use client';

import styles from './StatsCard.module.css';

export default function StatsCard({ icon, label, value, subtitle, gradient }) {
    return (
        <div className={styles.card}>
            <div className={styles.iconWrapper} style={{ background: gradient || 'var(--gradient-primary)' }}>
                {icon}
            </div>
            <div className={styles.info}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
                {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
            </div>
            <div className={styles.glowBg} style={{ background: gradient || 'var(--gradient-primary)' }} />
        </div>
    );
}
