"use client";

import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

export default function LevelUpCelebration() {
    const [show, setShow] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        const handleLevelUp = () => {
            setShow(true);
            setTimeout(() => setShow(false), 6000); // 6 seconds of confetti
        };

        if (typeof window !== 'undefined') {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener('resize', handleResize);
            window.addEventListener('level_up', handleLevelUp);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('level_up', handleLevelUp);
        };
    }, []);

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999
        }}>
            <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={true}
                numberOfPieces={400}
                gravity={0.15}
            />
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#fff',
                textShadow: '0 0 20px rgba(168, 85, 247, 0.8)',
                zIndex: 10000,
                pointerEvents: 'none',
                animation: 'popIn 0.5s ease-out forwards'
            }}>
                <h1 style={{ fontSize: '4rem', margin: 0 }}>LEVEL UP!</h1>
                <p style={{ fontSize: '1.5rem' }}>Your stats just got legendary.</p>
            </div>
            <style jsx>{`
                @keyframes popIn {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    80% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
