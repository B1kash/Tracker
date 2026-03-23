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
            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', overflowY: 'auto', background: '#120f17', border: '1px solid #3d2254', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <button className={styles.closeBtn} onClick={onClose} style={{ zIndex: 10 }}>
                    <IoClose size={24} />
                </button>
                
                <div style={{ background: 'linear-gradient(180deg, rgba(88,32,135,0.15) 0%, rgba(18,15,23,0) 100%)', padding: '25px', margin: '-20px -20px 20px -20px', borderBottom: '1px solid rgba(88,32,135,0.2)' }}>
                    <h2 className={styles.modalTitle} style={{ textAlign: 'left', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem' }}>
                        <span className="page-title-gradient">AI Oracle</span> <IoSparklesOutline style={{ color: 'var(--accent-purple)' }} />
                    </h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
                        Consult the AI Oracle for deep insights into your physical progress, or ask it to brutally roast your weekly goals.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={fetchCoachAdvice} disabled={loading} style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'var(--accent-purple)', border: 'none' }}>
                        <IoChatbubbleEllipsesOutline size={20} />
                        Get Gym Advice
                    </button>
                    <button className="btn" onClick={fetchRoast} disabled={loading} style={{ flex: '1 1 calc(50% - 12px)', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'linear-gradient(135deg, #ff4d4d 0%, var(--accent-orange) 100%)', color: 'white', border: 'none' }}>
                        <IoFlameOutline size={20} />
                        Roast My Progress
                    </button>
                    <button className="btn" onClick={fetchSupplements} disabled={loading} style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '1rem', background: 'rgba(32, 219, 133, 0.1)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)' }}>
                        💊 Suggest Supplements
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
                                background: roast ? 'linear-gradient(145deg, rgba(255,77,77,0.05), rgba(0,0,0,0))' : 'linear-gradient(145deg, rgba(138,43,226,0.05), rgba(0,0,0,0))', 
                                padding: '25px', 
                                borderRadius: '16px', 
                                color: 'var(--text-primary)', 
                                borderLeft: `4px solid ${roast ? 'var(--accent-orange)' : 'var(--accent-purple)'}`,
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)',
                                fontSize: '1.05rem',
                                lineHeight: '1.6'
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
