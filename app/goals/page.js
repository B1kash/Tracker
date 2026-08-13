'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageSkeleton from '@/components/PageSkeleton';
import ProgressRing from '@/components/ProgressRing';
import styles from '../page.module.css';

export default function GoalsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoalData() {
      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) return router.push('/auth');

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/dashboard/today`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Goals error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchGoalData();
  }, [router]);

  if (loading) return <PageSkeleton type="dashboard" />;

  const goal = data?.goal;

  return (
    <div className={styles.page}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className="page-title">
            <span className="page-title-gradient">My Goal</span>
          </h1>
          <p className="page-subtitle">Your primary objective and progress</p>
        </div>
        <div className={styles.headerActions}>
            <button className="btn" style={{ background: 'var(--accent-purple)', color: 'white', border: 'none' }} onClick={() => router.push('/onboarding')}>
                Update Goal
            </button>
        </div>
      </div>

      <div className="stats-grid stagger-children" style={{ gridTemplateColumns: '1fr' }}>
        {goal ? (
            <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>{goal.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>{goal.description || goal.type}</p>
                    </div>
                    <ProgressRing percent={goal.progressPercentage || 0} size={120} color="primary" label={`${goal.progressPercentage || 0}%`} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Starting Value</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{goal.startingValue || 0} {goal.unit}</p>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Current Value</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{goal.currentValue || 0} {goal.unit}</p>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Target Value</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-accent)' }}>{goal.targetValue} {goal.unit}</p>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>Target Date</p>
                        <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{new Date(goal.targetDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                <h2>No Active Goal</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '16px', marginBottom: '24px' }}>Set your first goal to get a personalized AI plan.</p>
                <button className="btn" style={{ background: 'var(--text-accent)', color: 'white', border: 'none' }} onClick={() => router.push('/onboarding')}>
                    Set Goal
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
