import styles from './PageSkeleton.module.css';

export default function PageSkeleton({ type = 'dashboard' }) {
    return (
        <div className={styles.skeletonContainer}>
            <div className={styles.headerGroup}>
                <div className={`${styles.pulse} ${styles.titlePulse}`}></div>
                <div className={`${styles.pulse} ${styles.subtitlePulse}`}></div>
            </div>
            
            {type === 'dashboard' && (
                <>
                    <div className={styles.cardGrid}>
                        <div className={`${styles.pulse} ${styles.cardPulse}`}></div>
                        <div className={`${styles.pulse} ${styles.cardPulse}`}></div>
                        <div className={`${styles.pulse} ${styles.cardPulse}`}></div>
                        <div className={`${styles.pulse} ${styles.cardPulse}`}></div>
                    </div>
                    
                    <div className={styles.listGroup}>
                        <div className={`${styles.pulse} ${styles.listTitlePulse}`}></div>
                        <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                        <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                        <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                    </div>
                </>
            )}

            {type === 'list' && (
                <div className={styles.listGroup}>
                    <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                    <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                    <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                    <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                    <div className={`${styles.pulse} ${styles.listItemPulse}`}></div>
                </div>
            )}
        </div>
    );
}
