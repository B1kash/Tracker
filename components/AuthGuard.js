"use client";

import { useState, useEffect } from 'react';
import styles from './AuthGuard.module.css';
import { useRouter } from 'next/navigation';
import LevelUpCelebration from './LevelUpCelebration';
import RestTimer from './RestTimer';

export default function AuthGuard({ children }) {
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const storedToken = localStorage.getItem('jwt_token');
        if (storedToken) {
            setToken(storedToken);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            localStorage.setItem('jwt_token', data.token);
            // Optionally store username or _id
            localStorage.setItem('user_id', data._id);
            localStorage.setItem('username', data.username);

            setToken(data.token);
        } catch (err) {
            setError(err.message);
        }
    };

    if (isLoading) {
        return <div className={styles.loadingScreen}>Loading Tracker...</div>;
    }

    if (!token) {
        return (
            <div className={styles.authContainer}>
                <div className={styles.authCard}>
                    <img src="/logo.svg" alt="Life Tracker" className={styles.logo} onError={(e) => e.target.style.display = 'none'} />
                    <h1 className={styles.authTitle}>Life Tracker</h1>
                    <p className={styles.authSubtitle}>
                        {isLogin ? 'Welcome back! Log in to continue.' : 'Create an account to start tracking.'}
                    </p>

                    <form onSubmit={handleSubmit} className={styles.authForm}>
                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <div className={styles.inputGroup}>
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                minLength={3}
                                placeholder="Enter your username"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter your password"
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            {isLogin ? 'Login' : 'Register'}
                        </button>
                    </form>

                    <button
                        className={styles.toggleBtn}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <LevelUpCelebration />
            <RestTimer />
            {children}
        </>
    );
}
