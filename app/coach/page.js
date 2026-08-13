'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageSkeleton from '@/components/PageSkeleton';
import styles from '../page.module.css';

export default function CoachPage() {
  const router = useRouter();
  const [review, setReview] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoachData() {
      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) return router.push('/auth');
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        const [reviewRes, analysisRes] = await Promise.all([
          fetch(`${apiUrl}/api/ai/weekly-review`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/ai/analyze-progress`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (reviewRes.ok) setReview(await reviewRes.json());
        if (analysisRes.ok) {
            const analysis = await analysisRes.json();
            setAdjustments(analysis.adjustments || []);
        }
      } catch (e) {
        console.error("Coach error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchCoachData();
  }, [router]);

  const handleAdjustment = async (id, action) => {
      try {
          const token = localStorage.getItem('jwt_token');
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          await fetch(`${apiUrl}/api/ai/adjust-plan/${id}`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ action })
          });
          setAdjustments(prev => prev.filter(a => a._id !== id));
      } catch (e) {
          console.error("Failed to update adjustment", e);
      }
  }

  if (loading) return <PageSkeleton type="dashboard" />;

  return (
    <div className={styles.page}>
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className="page-title">
            <span className="page-title-gradient">AI Coach</span>
          </h1>
          <p className="page-subtitle">Your personalized insights and adjustments</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* WEEKLY REVIEW */}
        <div className="card">
          <h2 style={{ marginBottom: '16px', color: 'var(--text-accent)' }}>Weekly Review</h2>
          {review ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                      <strong>Progress:</strong> <p>{review.progress}</p>
                  </div>
                  <div>
                      <strong>Wins:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                          {review.wins?.map((win, i) => <li key={i}>{win}</li>)}
                      </ul>
                  </div>
                  <div>
                      <strong>Needs Attention:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--text-muted)' }}>
                          {review.needsAttention?.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                  </div>
                  <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
                      <strong>Recommendation:</strong> <p style={{ marginTop: '8px' }}>{review.recommendation}</p>
                  </div>
                  <div>
                      <strong>Next Week Focus:</strong> <p style={{ color: 'var(--text-accent)', fontWeight: 'bold' }}>{review.nextWeekFocus}</p>
                  </div>
              </div>
          ) : (
              <p>No recent data to generate a review.</p>
          )}
        </div>

        {/* ADJUSTMENTS */}
        {adjustments.length > 0 && (
            <div className="card" style={{ border: '1px solid var(--text-accent)' }}>
            <h2 style={{ marginBottom: '16px' }}>Recommended Adjustments</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
                {adjustments.map(adj => (
                    <div key={adj._id} style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ textTransform: 'capitalize' }}>{adj.category} Adjustment</strong>
                        </div>
                        <p style={{ marginBottom: '8px' }}>{adj.reason}</p>
                        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                            <strong style={{ color: 'var(--text-accent)' }}>Proposed Change:</strong> {adj.proposedValue}
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>{adj.explanation}</p>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn" style={{ background: 'var(--text-accent)', color: 'white', flex: 1, border: 'none' }} onClick={() => handleAdjustment(adj._id, 'Accept')}>Accept</button>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleAdjustment(adj._id, 'Reject')}>Reject</button>
                        </div>
                    </div>
                ))}
            </div>
            </div>
        )}
      </div>
    </div>
  );
}
