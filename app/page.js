'use client';

import { useState, useEffect } from 'react';
import { IoBarbell, IoBookOutline, IoVideocamOutline, IoTrophyOutline, IoTrendingUp, IoTimeOutline } from 'react-icons/io5';
import StatsCard from '@/components/StatsCard';
import ProgressRing from '@/components/ProgressRing';
import EmptyState from '@/components/EmptyState';
import WeeklyQuests from '@/components/WeeklyQuests';
import MilestoneGoals from '@/components/MilestoneGoals';
import ProgressCardModal from '@/components/ProgressCard';
import { getStats, getRecentActivity } from '@/lib/storage';
import styles from './page.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [st, act] = await Promise.all([getStats(), getRecentActivity()]);
        setStats(st);
        setRecentActivity(act);
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        setMounted(true);
      }
    }
    fetchDashboard();
  }, []);

  if (!mounted) return null;

  const hasGoals = stats && stats.totalGoals > 0;

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'gym': return 'badge badge-rose';
      case 'learning': return 'badge badge-purple';
      case 'content': return 'badge badge-cyan';
      default: return 'badge badge-purple';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'gym': return <IoBarbell />;
      case 'learning': return <IoBookOutline />;
      case 'content': return <IoVideocamOutline />;
      default: return <IoTrendingUp />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className={styles.page}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <span className="page-title-gradient">Dashboard</span>
          </h1>
          <p className="page-subtitle">Track your goals and stay on top of your game</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
            Share Progress ✨
        </button>
      </div>

      {!hasGoals ? (
        <EmptyState
          title="Welcome to LifeTracker!"
          message="Start adding goals in Gym, Learning, or Content Creation to see your progress here."
        />
      ) : (
        <>
          <div className="stats-grid stagger-children">
            <StatsCard
              icon={<IoTrophyOutline size={22} />}
              label="Total Items"
              value={stats.totalGoals}
              subtitle={`${stats.totalCompleted} completed`}
              gradient="var(--gradient-primary)"
            />
            <StatsCard
              icon={<IoBarbell size={22} />}
              label="Gym Days"
              value={stats.gym.totalDays}
              subtitle={`${stats.gym.totalExercises} exercises`}
              gradient="var(--gradient-gym)"
            />
            <StatsCard
              icon={<IoBookOutline size={22} />}
              label="Learning"
              value={stats.learning.total}
              subtitle={`${stats.learning.completed} done`}
              gradient="var(--gradient-learning)"
            />
            <StatsCard
              icon={<IoVideocamOutline size={22} />}
              label="Content"
              value={stats.content.total}
              subtitle={`${stats.content.posted} posted`}
              gradient="var(--gradient-content)"
            />
          </div>

          <div className={styles.progressSection}>
            <h2 className="section-title">Category Progress</h2>
            <div className={styles.ringsContainer}>
              <div className={styles.ringCard}>
                <ProgressRing percent={stats.gym.percent} size={130} color="gym" label="Gym" />
              </div>
              <div className={styles.ringCard}>
                <ProgressRing percent={stats.learning.percent} size={130} color="learning" label="Learning" />
              </div>
              <div className={styles.ringCard}>
                <ProgressRing percent={stats.content.percent} size={130} color="content" label="Content" />
              </div>
            </div>
          </div>

          {recentActivity.length > 0 && (
            <div className={styles.activitySection}>
              <h2 className="section-title">Recent Activity</h2>
              <div className={styles.activityList}>
                {recentActivity.map((item, idx) => (
                  <div key={item.id || idx} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityTitle}>{item.title}</span>
                      <div className={styles.activityMeta}>
                        <span className={getCategoryBadge(item.category)}>{item.categoryLabel}</span>
                        {item.detail && <span className={styles.activityDetail}>{item.detail}</span>}
                      </div>
                    </div>
                    <span className={styles.activityTime}>
                      <IoTimeOutline size={14} />
                      {formatTimeAgo(item.updatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <MilestoneGoals />
          <WeeklyQuests />
          
          <ProgressCardModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
        </>
      )}
    </div>
  );
}
