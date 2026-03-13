import styles from './LevelBadge.module.css';
import { IoStar } from 'react-icons/io5';

export default function LevelBadge({ xp, level }) {
    const XP_PER_LEVEL = 1000;
    const currentLevelXP = xp % XP_PER_LEVEL;
    const progressPercent = Math.min(100, Math.round((currentLevelXP / XP_PER_LEVEL) * 100));

    return (
        <div className={styles.badgeContainer}>
            <div className={styles.levelInfo}>
                <div className={styles.levelBadge}>
                    <IoStar className={styles.starIcon} />
                    <span>Lv.{level}</span>
                </div>
                <div className={styles.xpText}>
                    <span className={styles.currentXp}>{xp}</span>
                    <span className={styles.maxXp}>XP</span>
                </div>
            </div>

            <div className={styles.progressTrack}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
            <div className={styles.progressLabel}>
                {currentLevelXP} / {XP_PER_LEVEL} to Next Level
            </div>
        </div>
    );
}
