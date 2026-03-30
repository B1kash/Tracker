import { useState, useEffect } from 'react';
import { IoClose, IoChatbubbleEllipsesOutline, IoFlameOutline, IoSparklesOutline } from 'react-icons/io5';
import { getAICoachAdvice, getAIRoast, getSupplementAdviceWithAI } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';
import styles from './ProgressCard.module.css'; // Reusing styles from ProgressCard mostly

export default function AICoachModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [advice, setAdvice] = useState('');
    const [roast, setRoast] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const fetchCoachAdvice = async () => {
        setLoading(true);
        setRoast('');
        try {
            const res = await getAICoachAdvice();
            if (res && res.advice) {
                setAdvice(res.advice);
            }
        } catch (e) {
            console.error(e);
            setAdvice("The Oracle is currently disconnected. Try again later!");
        }
        setLoading(false);
    };

    const fetchRoast = async () => {
        setLoading(true);
        setAdvice('');
        try {
            const res = await getAIRoast();
            if (res && res.roast) {
                setRoast(res.roast);
            }
        } catch (e) {
            console.error(e);
            setRoast("You're too weak right now, even my roasts won't connect. Try again later!");
        }
        setLoading(false);
    };

    const fetchSupplements = async () => {
        setLoading(true);
        setRoast('');
        try {
            const res = await getSupplementAdviceWithAI();
            if (res && res.supplements) {
                setAdvice(res.supplements);
            }
        } catch (e) {
            console.error(e);
            setAdvice("The Oracle is currently disconnected. Try again later!");
        }
        setLoading(false);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', width: '90%', maxHeight: '85vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <button className={styles.closeBtn} onClick={onClose} style={{ zIndex: 10 }}>
                    <IoClose size={24} />
                </button>
                
                <div style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.1) 0%, transparent 100%)', padding: '30px 25px', margin: '-20px -20px 25px -20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <h2 className={styles.modalTitle} style={{ textAlign: 'center', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '2.2rem' }}>
                        <span className="page-title-gradient">AI Oracle</span> <IoSparklesOutline style={{ color: 'var(--accent-purple)' }} />
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: '0 auto', fontSize: '1rem', textAlign: 'center', maxWidth: '500px', lineHeight: '1.5' }}>
                        Consult the mystical intelligence. Seek guidance for your journey, or test your ego with a brutal roast.
                    </p>
                </div>

                <style>{`
                    .oracle-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin-bottom: 30px;
                    }
                    .oracle-card {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.06);
                        border-radius: 16px;
                        padding: 25px 15px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 15px;
                        cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        text-align: center;
                    }
                    .oracle-card:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    .oracle-card:not(:disabled):hover {
                        transform: translateY(-5px);
                    }
                    .oracle-card-title {
                        font-weight: 700;
                        font-size: 1.05rem;
                        color: var(--text-primary);
                    }
                    .oracle-card-desc {
                        font-size: 0.8rem;
                        color: var(--text-muted);
                        line-height: 1.4;
                    }
                    
                    /* Specific Themes */
                    .oracle-advice { background: linear-gradient(145deg, rgba(139,92,246,0.1), rgba(0,0,0,0)); border-color: rgba(139,92,246,0.2); }
                    .oracle-advice:not(:disabled):hover { box-shadow: 0 10px 30px rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.6); }
                    .oracle-advice .oracle-icon { color: #c4b5fd; background: rgba(139,92,246,0.2); }

                    .oracle-roast { background: linear-gradient(145deg, rgba(244,63,94,0.1), rgba(0,0,0,0)); border-color: rgba(244,63,94,0.2); }
                    .oracle-roast:not(:disabled):hover { box-shadow: 0 10px 30px rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.6); }
                    .oracle-roast .oracle-icon { color: #fda4af; background: rgba(244,63,94,0.2); }

                    .oracle-supps { background: linear-gradient(145deg, rgba(16,185,129,0.1), rgba(0,0,0,0)); border-color: rgba(16,185,129,0.2); }
                    .oracle-supps:not(:disabled):hover { box-shadow: 0 10px 30px rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.6); }
                    .oracle-supps .oracle-icon { color: #6ee7b7; background: rgba(16,185,129,0.2); }

                    .oracle-icon {
                        width: 50px;
                        height: 50px;
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    @media (max-width: 600px) {
                        .oracle-grid { grid-template-columns: 1fr; }
                        .oracle-card { padding: 20px; flex-direction: row; text-align: left; }
                        .oracle-icon { flex-shrink: 0; }
                    }
                `}</style>

                <div className="oracle-grid">
                    <button className="oracle-card oracle-advice" onClick={fetchCoachAdvice} disabled={loading}>
                        <div className="oracle-icon"><IoChatbubbleEllipsesOutline size={26} /></div>
                        <div>
                            <div className="oracle-card-title">Gym Advice</div>
                            <div className="oracle-card-desc">Actionable tips to break plateaus.</div>
                        </div>
                    </button>
                    
                    <button className="oracle-card oracle-roast" onClick={fetchRoast} disabled={loading}>
                        <div className="oracle-icon"><IoFlameOutline size={26} /></div>
                        <div>
                            <div className="oracle-card-title">Roast Me</div>
                            <div className="oracle-card-desc">A brutal assessment of your weakness.</div>
                        </div>
                    </button>
                    
                    <button className="oracle-card oracle-supps" onClick={fetchSupplements} disabled={loading}>
                        <div className="oracle-icon" style={{ fontSize: '1.4rem' }}>💊</div>
                        <div>
                            <div className="oracle-card-title">Supplements</div>
                            <div className="oracle-card-desc">Stack recommendations for your goals.</div>
                        </div>
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--accent-purple)' }}>
                        <div className="spinner" style={{ margin: '0 auto 15px auto', width: '40px', height: '40px', borderWidth: '4px' }}></div>
                        <p style={{ fontSize: '1.1rem', letterSpacing: '0.5px' }}>The Oracle is analyzing your timeline...</p>
                    </div>
                ) : (
                    <div style={{ padding: '0px', textAlign: 'left' }}>
                        {(advice || roast) && (
                            <div className="ai-markdown-container" style={{ 
                                background: roast ? 'linear-gradient(145deg, rgba(244,63,94,0.05), transparent)' : 'linear-gradient(145deg, rgba(139,92,246,0.05), transparent)', 
                                padding: '30px', 
                                borderRadius: '16px', 
                                color: 'var(--text-primary)', 
                                borderLeft: `4px solid ${roast ? '#f43f5e' : '#8b5cf6'}`,
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '1.05rem',
                                lineHeight: '1.7'
                            }}>
                                <style>{`
                                    .ai-markdown-container h1, .ai-markdown-container h2, .ai-markdown-container h3 {
                                        color: var(--text-primary);
                                        margin-top: 1.5em;
                                        margin-bottom: 0.5em;
                                        font-weight: 600;
                                    }
                                    .ai-markdown-container h1 { font-size: 1.5rem; }
                                    .ai-markdown-container h2 { font-size: 1.3rem; }
                                    .ai-markdown-container h3 { font-size: 1.1rem; }
                                    .ai-markdown-container p {
                                        margin-bottom: 1em;
                                        color: #e0dced;
                                    }
                                    .ai-markdown-container ul, .ai-markdown-container ol {
                                        padding-left: 1.5em;
                                        margin-bottom: 1em;
                                        color: #e0dced;
                                    }
                                    .ai-markdown-container li {
                                        margin-bottom: 0.5em;
                                    }
                                    .ai-markdown-container strong {
                                        color: #ffffff;
                                        font-weight: 700;
                                    }
                                    .ai-markdown-container em {
                                        color: var(--accent-cyan);
                                        font-style: italic;
                                    }
                                    .ai-markdown-container blockquote {
                                        border-left: 3px solid var(--accent-cyan);
                                        padding-left: 1em;
                                        margin-left: 0;
                                        color: var(--text-muted);
                                        font-style: italic;
                                    }
                                `}</style>

                                {advice && <ReactMarkdown>{advice}</ReactMarkdown>}
                                {roast && (
                                    <div style={{ fontStyle: 'italic', fontSize: '1.2rem', color: '#ff8a8a', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                        <div style={{ fontSize: '2rem', opacity: 0.5 }}>"</div>
                                        <p style={{ margin: 0, paddingBottom: '15px', paddingTop: '10px' }}>{roast}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
