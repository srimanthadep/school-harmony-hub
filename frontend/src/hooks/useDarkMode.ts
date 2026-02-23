import { useState, useEffect } from 'react';

export function useDarkMode() {
    const [isDark, setIsDark] = useState<boolean>(() => {
        const stored = localStorage.getItem('dark-mode');
        if (stored !== null) return stored === 'true';
        return false; // Default: always light mode
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('dark-mode', String(isDark));
    }, [isDark]);

    return { isDark, toggle: () => setIsDark(d => !d) };
}
