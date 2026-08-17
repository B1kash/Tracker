"use client";

import { useState, useEffect } from 'react';
import styles from './AuthGuard.module.css';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '@/lib/storage';
import LevelUpCelebration from './LevelUpCelebration';
import RestTimer from './RestTimer';
import { FiUser, FiLock } from 'react-icons/fi';

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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${endpoint}`, {
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

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setError('');
            const data = await googleLogin(credentialResponse.credential);
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_id', data._id);
            localStorage.setItem('username', data.username);
            setToken(data.token);
        } catch (err) {
            setError(err.message || 'Google Authentication failed');
        }
    };

    if (isLoading) {
        return <div className={styles.loadingScreen}>Loading Tracker...</div>;
    }

    if (!token) {
        return (
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
                <div className={styles.authContainer}>
                    <div className={styles.authCard}>
                        <div className={styles.logoWrapper}>
                            <img src="/logo.svg" alt="Life Tracker" className={styles.logo} onError={(e) => e.target.style.display = 'none'} />
                        </div>
                        <h1 className={styles.authTitle}>Life Tracker</h1>
                        <p className={styles.authSubtitle}>
                            {isLogin ? 'Welcome back! Log in to continue your journey.' : 'Create an account to start tracking.'}
                        </p>

                        <form onSubmit={handleSubmit} className={styles.authForm}>
                            {error && <div className={styles.errorMessage}>{error}</div>}

                            <div className={styles.inputGroup}>
                                <label>Username</label>
                                <div className={styles.inputWrapper}>
                                    <FiUser className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        minLength={3}
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Password</label>
                                <div className={styles.inputWrapper}>
                                    <FiLock className={styles.inputIcon} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </div>

                            <button type="submit" className={styles.submitBtn}>
                                {isLogin ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className={styles.divider}>
                            <span>OR</span>
                        </div>

                        <div className={styles.googleWrapper}>
                            <GoogleLogin 
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Login Failed')}
                                theme="outline"
                                shape="rectangular"
                                text={isLogin ? "signin_with" : "signup_with"}
                                width="300"
                            />
                        </div>

                        <button
                            className={styles.toggleBtn}
                            onClick={() => setIsLogin(!isLogin)}
                            style={{ marginTop: '1.5rem' }}
                        >
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span>{isLogin ? "Register" : "Login"}</span>
                        </button>
                    </div>
                </div>
            </GoogleOAuthProvider>
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
