'use client';

import { useState, useEffect } from 'react';
import { IoGlobeOutline, IoPeopleOutline, IoShieldOutline, IoPersonAddOutline } from 'react-icons/io5';
import { getLeaderboard, getSquad, addFriend, createSquad, joinSquad } from '@/lib/storage';
import styles from './page.module.css';

export default function SocialPage() {
    const [activeTab, setActiveTab] = useState('Global');
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState({ global: [], friends: [] });
    const [squad, setSquad] = useState(null);

    const [modal, setModal] = useState({ show: false, mode: '', input: '' });
    const [msg, setMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [lbData, sqData] = await Promise.all([
                getLeaderboard(),
                getSquad()
            ]);
            let lbJson = lbData;
            try { lbJson = await lbData.json() || { global: [], friends: [] }; } catch { lbJson = { global: [], friends: [] }; } // handle apiCall vs return object if it was fixed
            if (lbData.global) lbJson = lbData; // if already an object
            
            let sqJson = sqData;
            if (sqData && typeof sqData.json === 'function') sqJson = await sqData.json();

            setLeaderboard(lbJson);
            setSquad(sqJson?.squad || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const showMsg = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(''), 3000);
    };

    const handleAction = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (modal.mode === 'addFriend') res = await addFriend(modal.input);
            if (modal.mode === 'createSquad') res = await createSquad(modal.input);
            if (modal.mode === 'joinSquad') res = await joinSquad(modal.input);
            
            if (res && res.status !== 200) {
                const err = await res.json();
                throw new Error(err.message || 'Action failed');
            }
            showMsg('✅ Success!');
            setModal({ show: false, mode: '', input: '' });
            fetchData();
        } catch (e) {
            showMsg('❌ ' + e.message);
        }
    };

    const renderCard = (user, index) => (
        <div key={user._id} className={styles.userCard}>
            <div className={styles.rankCircle}>{index + 1}</div>
            <div className={styles.userInfo}>
                <div className={styles.username}>{user.username}</div>
                <div className={styles.userStats}>Level {user.gamification?.level || 1} • Streak 🔥 {user.gamification?.currentStreak || 0}</div>
            </div>
            <div className={styles.xpBox}>{user.gamification?.xp || 0} XP</div>
        </div>
    );

    return (
        <div className="page-layout">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="page-title-gradient">🤝 Social Platform</span>
                </h1>
                <p className="page-subtitle">Compete with friends or build the ultimate squad</p>
            </div>

            {msg && <div className={styles.toast}>{msg}</div>}

            <div className={styles.tabContainer}>
                <button className={`${styles.tab} ${activeTab === 'Global' ? styles.activeTab : ''}`} onClick={() => setActiveTab('Global')}>
                    <IoGlobeOutline /> Global
                </button>
                <button className={`${styles.tab} ${activeTab === 'Friends' ? styles.activeTab : ''}`} onClick={() => setActiveTab('Friends')}>
                    <IoPeopleOutline /> Friends
                </button>
                <button className={`${styles.tab} ${activeTab === 'Squad' ? styles.activeTab : ''}`} onClick={() => setActiveTab('Squad')}>
                    <IoShieldOutline /> Squad
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading social data...</div>
            ) : (
                <div className={styles.content}>
                    {activeTab === 'Global' && (
                        <div className="card">
                            <h2 style={{ marginBottom: '20px' }}>Global Leaderboard</h2>
                            {(leaderboard.global || []).map((u, i) => renderCard(u, i))}
                            {(!leaderboard.global || leaderboard.global.length === 0) && <p className={styles.empty}>No users found.</p>}
                        </div>
                    )}

                    {activeTab === 'Friends' && (
                        <div className="card">
                            <div className={styles.headerRow}>
                                <h2>Friends Leaderboard</h2>
                                <button className="btn btn-primary btn-sm" onClick={() => setModal({ show: true, mode: 'addFriend', input: '' })}>
                                    <IoPersonAddOutline/> Add Friend
                                </button>
                            </div>
                            {(leaderboard.friends || []).map((u, i) => renderCard(u, i))}
                            {(!leaderboard.friends || leaderboard.friends.length === 0) && <p className={styles.empty}>No friends yet. Add some to start competing!</p>}
                        </div>
                    )}

                    {activeTab === 'Squad' && (
                        <div className="card">
                            {!squad ? (
                                <div className={styles.emptySquad}>
                                    <IoShieldOutline size={64} color="var(--accent-purple)" />
                                    <h2>You are a Lone Wolf</h2>
                                    <p>Join or create a squad to get weekly cooperative quests.</p>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px', justifyContent: 'center' }}>
                                        <button className="btn btn-primary" onClick={() => setModal({ show: true, mode: 'createSquad', input: '' })}>Create Squad</button>
                                        <button className="btn btn-secondary" onClick={() => setModal({ show: true, mode: 'joinSquad', input: '' })}>Join via Invite</button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-purple)' }}>{squad.name}</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Invite Code: <strong>{squad.inviteCode}</strong></p>

                                    <div className={styles.questBox}>
                                        <div className={styles.questHeader}>WEEKLY SQUAD QUEST</div>
                                        <h3 style={{ margin: '10px 0' }}>{squad.currentQuest?.title}</h3>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${Math.min(100, ((squad.currentQuest?.current || 0) / (squad.currentQuest?.target || 1)) * 100)}%` }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.9rem' }}>
                                            <span>Progress: {squad.currentQuest?.current || 0} / {squad.currentQuest?.target}</span>
                                            <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>Reward: {squad.currentQuest?.xpReward} XP</span>
                                        </div>
                                    </div>

                                    <h3 style={{ marginTop: '30px', marginBottom: '15px' }}>Squad Members</h3>
                                    {(squad.members || []).map((u, i) => renderCard(u, i))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {modal.show && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>{modal.mode === 'addFriend' ? 'Add Friend' : modal.mode === 'createSquad' ? 'Create Squad' : 'Join Squad'}</h2>
                        <form onSubmit={handleAction}>
                            <input 
                                className="form-input" 
                                style={{ marginTop: '15px', marginBottom: '20px' }}
                                placeholder={modal.mode === 'addFriend' ? 'Exact Username' : modal.mode === 'createSquad' ? 'Squad Name' : 'INVITE CODE'}
                                value={modal.input}
                                onChange={(e) => setModal({ ...modal, input: e.target.value })}
                                autoCapitalize={modal.mode === 'joinSquad' ? "characters" : "none"}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary flex-1">Confirm</button>
                                <button type="button" className="btn btn-secondary flex-1" onClick={() => setModal({ show: false, mode: '', input: '' })}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
