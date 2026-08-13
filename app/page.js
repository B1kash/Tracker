'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IoBarbell, IoRestaurantOutline, IoCheckboxOutline, IoTrophyOutline, IoArrowForward } from 'react-icons/io5';
import PageSkeleton from '@/components/PageSkeleton';
import ProgressRing from '@/components/ProgressRing';
import styles from './page.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
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
        console.error("Dashboard error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [router]);

  if (loading) return <PageSkeleton type="dashboard" />;

  if (data && !data.user?.onboardingCompleted) {
    return (
      <div className={styles.page}>
        <div className={styles.dashboardHeader}>
          <h1 className="page-title">Welcome to LifeTracker</h1>
          <p className="page-subtitle">Let's set up your personalized AI plan.</p>
        </div>
        <div className="card" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
          <h2>Ready to get started?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            We need a little bit of information about your goals and current fitness level.
          </p>
          <button 
            className="btn" 
            style={{ background: 'var(--text-accent)', color: 'white', border: 'none', padding: '12px 24px', fontSize: '16px' }} 
            onClick={() => router.push('/onboarding')}
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  const { goal, plan, workout, nutrition, habits } = data || {};

  return (
    <div className={styles.page}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className="page-title">
            <span className="page-title-gradient">Today</span>
          </h1>
          <p className="page-subtitle">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className={styles.headerActions}>
            <button className="btn" style={{ background: 'var(--accent-purple)', color: 'white', border: 'none' }} onClick={() => router.push('/coach')}>
                AI Coach 🔮
            </button>
        </div>
      </div>

      <div className="stats-grid stagger-children" style={{ gridTemplateColumns: '1fr', marginBottom: '32px' }}>
        {/* GOAL SECTION */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoTrophyOutline /> PRIMARY GOAL
            </h3>
            <h2 style={{ fontSize: '24px', marginTop: '8px' }}>{goal ? goal.title : 'No active goal'}</h2>
            {goal && <p style={{ color: 'var(--text-muted)' }}>Target: {goal.targetValue} {goal.unit}</p>}
          </div>
          {goal && (
             <ProgressRing percent={goal.progressPercentage || 0} size={80} color="primary" label={`${goal.progressPercentage || 0}%`} />
          )}
        </div>
      </div>

      <div className="stats-grid stagger-children" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* WORKOUT */}
        <div className="card">
           <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <IoBarbell /> TODAY'S WORKOUT
            </h3>
            {workout ? (
              <>
                <h4 style={{ fontSize: '18px', marginBottom: '16px' }}>{workout.name || 'Custom Workout'}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(workout.exercises || []).slice(0, 3).map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
                      <span>{ex.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{ex.sets?.length || 0} sets</span>
                    </div>
                  ))}
                  {(workout.exercises || []).length > 3 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      + {(workout.exercises.length - 3)} more exercises
                    </p>
                  )}
                </div>
                <button className="btn" style={{ width: '100%', marginTop: '24px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                  Start Workout
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Rest Day</p>
                <button className="btn btn-secondary">Log Custom Workout</button>
              </div>
            )}
        </div>

        {/* NUTRITION */}
        <div className="card">
           <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <IoRestaurantOutline /> NUTRITION
            </h3>
            {nutrition && nutrition.targets ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Calories</span>
                    <span>{nutrition.calories} / {nutrition.targets.dailyCalories || nutrition.targets.calories} kcal</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (nutrition.calories / (nutrition.targets.dailyCalories || nutrition.targets.calories)) * 100)}%`, height: '100%', background: 'var(--text-accent)' }}></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                  <div style={{ textAlign: 'center', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Protein</div>
                    <div style={{ fontWeight: '600' }}>{nutrition.protein}g</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {nutrition.targets.proteinTarget || nutrition.targets.protein}g</div>
                  </div>
                  <div style={{ textAlign: 'center', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Carbs</div>
                    <div style={{ fontWeight: '600' }}>{nutrition.carbs}g</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {nutrition.targets.carbsTarget || nutrition.targets.carbs}g</div>
                  </div>
                  <div style={{ textAlign: 'center', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fats</div>
                    <div style={{ fontWeight: '600' }}>{nutrition.fats}g</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {nutrition.targets.fatsTarget || nutrition.targets.fats}g</div>
                  </div>
                </div>
              </div>
            ) : (
              <p>No nutrition targets set.</p>
            )}
            <button className="btn" style={{ width: '100%', marginTop: '24px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} onClick={() => router.push('/diet')}>
              Log Food
            </button>
        </div>
      </div>
    </div>
  );
}
