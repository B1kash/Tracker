'use client';

import { useState, useEffect, useRef } from 'react';
import { IoShareSocialOutline, IoTrophyOutline, IoClose, IoDownloadOutline } from 'react-icons/io5';
import { getGamificationData, getGymWorkouts } from '@/lib/storage';
import { toPng } from 'html-to-image';
import styles from './ProgressCard.module.css';

export default function ProgressCardModal({ isOpen, onClose }) {
    const [data, setData] = useState(null);
    const cardRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        async function load() {
            const gam = await getGamificationData();
            const workouts = await getGymWorkouts();
            
            // Calculate best lifts
            const bests = { Bench: 0, Squat: 0, Deadlift: 0 };
            const aliases = {
                'bench press': 'Bench', 'barbell bench press': 'Bench',
                'squat': 'Squat', 'barbell squat': 'Squat', 'back squat': 'Squat',
                'deadlift': 'Deadlift', 'barbell deadlift': 'Deadlift'
            };

            for (const w of workouts) {
                for (const ex of w.exercises) {
                    const name = ex.name.toLowerCase();
                    const group = aliases[name];
                    if (group) {
                        for (const set of ex.sets) {
                            if (set.completed && set.weight && Number(set.weight) > bests[group]) {
                                bests[group] = Number(set.weight);
                            }
                        }
                    }
                }
            }

            setData({ ...gam, bests });
        }
        load();
    }, [isOpen]);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                backgroundColor: '#0f172a',
                pixelRatio: 3 // High quality
            });
            const link = document.createElement('a');
            link.download = `lifetracker-stats-${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}><IoClose size={24} /></button>
                <h2 className={styles.modalTitle}>Share Progress</h2>
                
                {data ? (
                    <>
                        <div className={styles.cardWrapper}>
                            <div className={styles.progressCard} ref={cardRef}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardLogo}>
                                        <div className={styles.logoCircle}></div>
                                        LifeTracker
                                    </div>
                                    <div className={styles.levelBadge}>Level {data.level}</div>
                                </div>
                                
                                <div className={styles.statsRow}>
                                    <div className={styles.statBox}>
                                        <div className={styles.statLabel}>Current Streak</div>
                                        <div className={styles.statValue}>{data.currentStreak} 🔥</div>
                                    </div>
                                    <div className={styles.statBox}>
                                        <div className={styles.statLabel}>Total XP</div>
                                        <div className={styles.statValue}>{data.xp} ✨</div>
                                    </div>
                                </div>

                                <div className={styles.liftsSection}>
                                    <div className={styles.liftsTitle}>Current PRs</div>
                                    <div className={styles.liftsGrid}>
                                        <div className={styles.liftBox}>
                                            <div className={styles.liftName}>Bench</div>
                                            <div className={styles.liftValue}>{data.bests.Bench > 0 ? `${data.bests.Bench}kg` : '--'}</div>
                                        </div>
                                        <div className={styles.liftBox}>
                                            <div className={styles.liftName}>Squat</div>
                                            <div className={styles.liftValue}>{data.bests.Squat > 0 ? `${data.bests.Squat}kg` : '--'}</div>
                                        </div>
                                        <div className={styles.liftBox}>
                                            <div className={styles.liftName}>Deadlift</div>
                                            <div className={styles.liftValue}>{data.bests.Deadlift > 0 ? `${data.bests.Deadlift}kg` : '--'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={styles.cardFooter}>
                                    Generated by LifeTracker • Keep leveling up!
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleDownload}>
                                <IoDownloadOutline size={18} /> Download Image
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center' }}>Generating card...</div>
                )}
            </div>
        </div>
    );
}
