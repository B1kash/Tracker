'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, setTheme as saveTheme } from '@/lib/storage';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => { } });

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = getTheme();
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setThemeState(next);
        saveTheme(next);
        document.documentElement.setAttribute('data-theme', next);
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return (
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            (function() {
              var t = localStorage.getItem('app_theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            })();
          `,
                }}
            />
        );
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
