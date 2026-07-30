'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    IoGridOutline, IoBarbell, IoBookOutline, IoVideocamOutline, 
    IoSparkles, IoSunnyOutline, IoMoonOutline, IoCheckboxOutline, 
    IoCalendarOutline, IoLogOutOutline, IoSettingsOutline, 
    IoScaleOutline, IoPeopleOutline, IoChevronBack, IoChevronForward
} from 'react-icons/io5';
import { useTheme } from './ThemeProvider';
import { useEffect, useState } from 'react';
import { getGamificationData, getMe, logout } from '@/lib/storage';
import LevelBadge from './LevelBadge';
import styles from './Sidebar.module.css';

const navGroups = [
    {
        title: null,
        items: [
            { href: '/', label: 'Overview', icon: IoGridOutline },
            { href: '/habits', label: 'Habits', icon: IoCheckboxOutline },
            { href: '/calendar', label: 'Calendar', icon: IoCalendarOutline },
        ]
    },
    {
        title: 'Fitness',
        items: [
            { href: '/gym', label: 'Gym', icon: IoBarbell },
            { href: '/bodyweight', label: 'Body Weight', icon: IoScaleOutline },
        ]
    },
    {
        title: 'Growth',
        items: [
            { href: '/learning', label: 'Learning', icon: IoBookOutline },
            { href: '/content', label: 'Content', icon: IoVideocamOutline },
        ]
    },
    {
        title: 'Community',
        items: [
            { href: '/social', label: 'Squads', icon: IoPeopleOutline },
        ]
    },
];

const bottomItems = [
    { href: '/settings', label: 'Settings', icon: IoSettingsOutline },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [gamification, setGamification] = useState({ xp: 0, level: 1 });
    const [userProfile, setUserProfile] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        getGamificationData().then(setGamification).catch(console.error);
        getMe().then(setUserProfile).catch(console.error);

        const handleUpdates = () => {
            getGamificationData().then(setGamification).catch(console.error);
            getMe().then(setUserProfile).catch(console.error);
        };
        window.addEventListener('gamification_updated', handleUpdates);
        return () => window.removeEventListener('gamification_updated', handleUpdates);
    }, [pathname]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '88px' : '260px');
            if (isCollapsed) {
                 document.body.classList.add('sidebar-collapsed');
            } else {
                 document.body.classList.remove('sidebar-collapsed');
            }
        }
    }, [isCollapsed]);

    const renderItem = (item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
            <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                title={isCollapsed ? item.label : undefined}
            >
                <span className={styles.navIcon}>
                    <Icon size={20} />
                </span>
                {!isCollapsed && <span className={styles.navLabel}>{item.label}</span>}
                {isActive && <span className={styles.activeIndicator} />}
            </Link>
        );
    };

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
            <div className={styles.topArea}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <IoSparkles />
                    </div>
                    {!isCollapsed && <span className={styles.logoText}>LifeTracker</span>}
                </div>
                <button 
                    className={styles.collapseBtn} 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <IoChevronForward size={18} /> : <IoChevronBack size={18} />}
                </button>
            </div>

            <div className={styles.navMenu}>
                {navGroups.map((group, idx) => (
                    <div key={idx} className={styles.navGroup}>
                        {group.title && !isCollapsed && (
                            <div className={styles.groupTitle}>{group.title}</div>
                        )}
                        <nav className={styles.nav}>
                            {group.items.map(renderItem)}
                        </nav>
                    </div>
                ))}
                
                <div className={styles.navGroup} style={{ marginTop: 'auto' }}>
                    <nav className={styles.nav}>
                        {bottomItems.map(renderItem)}
                    </nav>
                </div>
            </div>

            <div className={styles.sidebarFooter}>
                {userProfile && !isCollapsed && (
                    <div className={styles.profileSection}>
                        {userProfile.profilePic ? (
                            <img src={userProfile.profilePic} className={styles.profilePic} alt="Profile" />
                        ) : (
                            <div className={styles.profileInitials}>
                                {userProfile?.name?.[0]?.toUpperCase() || userProfile?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className={styles.profileInfo}>
                            <div className={styles.profileName}>
                                {userProfile.name || userProfile.username}
                            </div>
                        </div>
                    </div>
                )}
                
                {!isCollapsed && <LevelBadge xp={gamification.xp} level={gamification.level} />}
                
                <div className={styles.footerActions}>
                    <button className={`${styles.themeToggle} ${isCollapsed ? styles.collapsedToggle : ''}`} onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? <IoSunnyOutline size={18} /> : <IoMoonOutline size={18} />}
                        {!isCollapsed && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
                    </button>
                    <button className={`${styles.themeToggle} ${styles.logoutBtn} ${isCollapsed ? styles.collapsedToggle : ''}`} onClick={logout} title="Logout">
                        <IoLogOutOutline size={18} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
