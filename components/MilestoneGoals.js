'use client';

import { useState, useEffect } from 'react';
import { IoFlagOutline, IoAdd, IoTrashOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/lib/storage';
import styles from './MilestoneGoals.module.css';

export default function MilestoneGoals() {
  const [goals, setGoals] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: '', targetValue: '', deadline: '' });

  const loadGoals = async () => {
    setGoals(await getGoals());
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!form.title || !form.targetValue || !form.deadline) return;
    await addGoal({ ...form, targetValue: Number(form.targetValue) });
    setForm({ title: '', targetValue: '', deadline: '' });
    setIsAdding(false);
    loadGoals();
  };

  const handleUpdateCurrent = async (id, currentValue) => {
    await updateGoal(id, { currentValue: Number(currentValue) });
    loadGoals();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await deleteGoal(id);
    loadGoals();
  };

  const calculateDaysLeft = (deadline) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IoFlagOutline size={20} style={{ color: 'var(--accent-cyan)' }} />
          <h2 className={styles.title}>Milestone Goals</h2>
        </div>
        {!isAdding && (
          <button className="btn btn-secondary btn-sm" onClick={() => setIsAdding(true)}>
            <IoAdd size={16} /> New Goal
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddGoal} className={styles.addForm}>
          <div className="form-group">
            <label className="form-label">Goal Title (e.g. 100kg Bench Press)</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Target Number</label>
              <input type="number" step="0.1" className="form-input" value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Deadline</label>
              <input type="date" className="form-input" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save Goal</button>
          </div>
        </form>
      )}

      {goals.length === 0 && !isAdding ? (
        <div className="empty-inline" style={{ marginTop: 0 }}>No milestone goals set. Aim for something big!</div>
      ) : (
        <div className={styles.goalsGrid}>
          {goals.map(goal => {
            const current = goal.currentValue || 0;
            const target = goal.targetValue;
            const percent = Math.min(100, Math.round((current / target) * 100));
            const daysLeft = calculateDaysLeft(goal.deadline);
            
            return (
              <div key={goal._id} className={styles.goalCard}>
                <div className={styles.goalTop}>
                  <div className={styles.goalTitle}>{goal.title}</div>
                  <button className="btn-icon" onClick={() => handleDelete(goal._id)}><IoTrashOutline size={14} /></button>
                </div>
                
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className={styles.progressText}>
                    <span>{current} / {target}</span>
                    <span>{percent}%</span>
                  </div>
                </div>

                <div className={styles.goalBottom}>
                  <div className={styles.deadlineInfo}>
                    {daysLeft > 0 ? (
                      <span style={{ color: daysLeft <= 7 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                        ⏳ {daysLeft} days left
                      </span>
                    ) : (
                      <span style={{ color: 'var(--accent-rose)' }}>Deadline passed</span>
                    )}
                  </div>
                  <div className={styles.updateValue}>
                    <input 
                      type="number" 
                      className="form-input form-input-sm" 
                      style={{ width: '60px', padding: '4px' }} 
                      placeholder="New max"
                      onBlur={(e) => {
                        if (e.target.value && Number(e.target.value) !== current) {
                          handleUpdateCurrent(goal._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value && Number(e.target.value) !== current) {
                          handleUpdateCurrent(goal._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
