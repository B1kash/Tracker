'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoGridOutline, IoBarbell, IoBookOutline, IoVideocamOutline, IoSparkles, IoSunnyOutline, IoMoonOutline, IoCheckboxOutline, IoCalendarOutline, IoLogOutOutline, IoSettingsOutline, IoScaleOutline, IoPeopleOutline } from 'react-icons/io5';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';
import { getGamificationData, getMe, logout } from '@/lib/storage';
import LevelBadge from './LevelBadge';
import styles from './Sidebar.module.css';

const navItems = [
    { href: '/', label: 'Dashboard', icon: IoGridOutline },
    { href: '/habits', label: 'Habits', icon: IoCheckboxOutline },
    { href: '/social', label: 'Social / Squads', icon: IoPeopleOutline },
    { href: '/gym', label: 'Gym', icon: IoBarbell },
    { href: '/learning', label: 'Learning', icon: IoBookOutline },
    { href: '/content', label: 'Content', icon: IoVideocamOutline },
    { href: '/calendar', label: 'Calendar', icon: IoCalendarOutline },
    { href: '/bodyweight', label: 'Body Weight', icon: IoScaleOutline },
    { href: '/settings', label: 'Settings', icon: IoSettingsOutline },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [gamification, setGamification] = useState({ xp: 0, level: 1 });
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        getGamificationData().then(setGamification).catch(console.error);
        getMe().then(setUserProfile).catch(console.error);

        // Listen for XP updates (custom event from addXP)
        const handleUpdates = () => {
            getGamificationData().then(setGamification).catch(console.error);
            getMe().then(setUserProfile).catch(console.error);
        };
        window.addEventListener('gamification_updated', handleUpdates);
        return () => window.removeEventListener('gamification_updated', handleUpdates);
    }, [pathname]);

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>
                    <IoSparkles />
                </div>
                <span className={styles.logoText}>LifeTracker</span>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>
                                <Icon size={20} />
                            </span>
                            <span className={styles.navLabel}>{item.label}</span>
                            {isActive && <span className={styles.activeIndicator} />}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.sidebarFooter}>
                {userProfile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        {userProfile.profilePic ? (
                            <img src={userProfile.profilePic} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                        ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-magenta))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                {userProfile?.name?.[0]?.toUpperCase() || userProfile?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {userProfile.name || userProfile.username}
                            </div>
                        </div>
                    </div>
                )}
                <LevelBadge xp={gamification.xp} level={gamification.level} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                    <button className={styles.themeToggle} onClick={toggleTheme} title="Toggle theme" style={{ flex: 1 }}>
                        {theme === 'dark' ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={18} />}
                        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </button>
                    <button className={styles.themeToggle} onClick={logout} title="Logout" style={{ flex: 1, color: '#ff4b4b' }}>
                        <IoLogOutOutline size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
