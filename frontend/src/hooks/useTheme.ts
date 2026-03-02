import { useState, useEffect, useCallback } from 'react';

// ─── Type Definitions ───────────────────────────────────────────────────────
export interface ThemeColors {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    accentLight: string;
}

export interface ThemePreset {
    id: string;
    name: string;
    emoji: string;
    colors: ThemeColors;
    sidebarGradient: string; // CSS linear-gradient
}

// ─── 12 Prebuilt Themes ─────────────────────────────────────────────────────
export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'oxford-navy',
        name: 'Oxford Navy',
        emoji: '🏫',
        colors: {
            primary: '#1a237e', primaryLight: '#283593', primaryDark: '#0d1b5e',
            secondary: '#f9a825', secondaryLight: '#ffd54f',
            accent: '#00897b', accentLight: '#4db6ac',
        },
        sidebarGradient: 'linear-gradient(180deg, #0d1b5e 0%, #1a237e 50%, #283593 100%)',
    },
    {
        id: 'emerald-forest',
        name: 'Emerald Forest',
        emoji: '🌿',
        colors: {
            primary: '#065f46', primaryLight: '#047857', primaryDark: '#064e3b',
            secondary: '#f59e0b', secondaryLight: '#fbbf24',
            accent: '#0891b2', accentLight: '#22d3ee',
        },
        sidebarGradient: 'linear-gradient(180deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    },
    {
        id: 'royal-purple',
        name: 'Royal Purple',
        emoji: '👑',
        colors: {
            primary: '#6b21a8', primaryLight: '#7c3aed', primaryDark: '#581c87',
            secondary: '#f97316', secondaryLight: '#fb923c',
            accent: '#0d9488', accentLight: '#2dd4bf',
        },
        sidebarGradient: 'linear-gradient(180deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)',
    },
    {
        id: 'crimson-red',
        name: 'Crimson Red',
        emoji: '🔴',
        colors: {
            primary: '#991b1b', primaryLight: '#b91c1c', primaryDark: '#7f1d1d',
            secondary: '#eab308', secondaryLight: '#facc15',
            accent: '#1d4ed8', accentLight: '#60a5fa',
        },
        sidebarGradient: 'linear-gradient(180deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
    },
    {
        id: 'ocean-blue',
        name: 'Ocean Blue',
        emoji: '🌊',
        colors: {
            primary: '#0c4a6e', primaryLight: '#0369a1', primaryDark: '#082f49',
            secondary: '#f59e0b', secondaryLight: '#fcd34d',
            accent: '#059669', accentLight: '#34d399',
        },
        sidebarGradient: 'linear-gradient(180deg, #082f49 0%, #0c4a6e 50%, #0369a1 100%)',
    },
    {
        id: 'sunset-orange',
        name: 'Sunset Orange',
        emoji: '🌅',
        colors: {
            primary: '#9a3412', primaryLight: '#c2410c', primaryDark: '#7c2d12',
            secondary: '#0ea5e9', secondaryLight: '#38bdf8',
            accent: '#16a34a', accentLight: '#4ade80',
        },
        sidebarGradient: 'linear-gradient(180deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)',
    },
    {
        id: 'charcoal-slate',
        name: 'Charcoal Slate',
        emoji: '🖤',
        colors: {
            primary: '#334155', primaryLight: '#475569', primaryDark: '#1e293b',
            secondary: '#f97316', secondaryLight: '#fb923c',
            accent: '#8b5cf6', accentLight: '#a78bfa',
        },
        sidebarGradient: 'linear-gradient(180deg, #1e293b 0%, #334155 50%, #475569 100%)',
    },
    {
        id: 'teal-aqua',
        name: 'Teal Aqua',
        emoji: '💎',
        colors: {
            primary: '#115e59', primaryLight: '#0f766e', primaryDark: '#134e4a',
            secondary: '#d946ef', secondaryLight: '#e879f9',
            accent: '#7c3aed', accentLight: '#a78bfa',
        },
        sidebarGradient: 'linear-gradient(180deg, #134e4a 0%, #115e59 50%, #0f766e 100%)',
    },
    {
        id: 'rose-pink',
        name: 'Rose Pink',
        emoji: '🌸',
        colors: {
            primary: '#9f1239', primaryLight: '#be123c', primaryDark: '#881337',
            secondary: '#0ea5e9', secondaryLight: '#38bdf8',
            accent: '#059669', accentLight: '#34d399',
        },
        sidebarGradient: 'linear-gradient(180deg, #881337 0%, #9f1239 50%, #be123c 100%)',
    },
    {
        id: 'golden-amber',
        name: 'Golden Amber',
        emoji: '✨',
        colors: {
            primary: '#92400e', primaryLight: '#b45309', primaryDark: '#78350f',
            secondary: '#7c3aed', secondaryLight: '#a78bfa',
            accent: '#0891b2', accentLight: '#22d3ee',
        },
        sidebarGradient: 'linear-gradient(180deg, #78350f 0%, #92400e 50%, #b45309 100%)',
    },
    {
        id: 'indigo-violet',
        name: 'Indigo Violet',
        emoji: '🔮',
        colors: {
            primary: '#3730a3', primaryLight: '#4338ca', primaryDark: '#312e81',
            secondary: '#10b981', secondaryLight: '#34d399',
            accent: '#f43f5e', accentLight: '#fb7185',
        },
        sidebarGradient: 'linear-gradient(180deg, #312e81 0%, #3730a3 50%, #4338ca 100%)',
    },
    {
        id: 'midnight-blue',
        name: 'Midnight Blue',
        emoji: '🌙',
        colors: {
            primary: '#1e3a5f', primaryLight: '#2563eb', primaryDark: '#172554',
            secondary: '#f59e0b', secondaryLight: '#fbbf24',
            accent: '#ec4899', accentLight: '#f472b6',
        },
        sidebarGradient: 'linear-gradient(180deg, #172554 0%, #1e3a5f 50%, #2563eb 100%)',
    },
];

const THEME_STORAGE_KEY = 'app-theme';
const CUSTOM_THEME_KEY = 'app-theme-custom';

// ─── Helper: apply CSS variables to :root ───────────────────────────────────
function applyThemeToDOM(colors: ThemeColors, sidebarGradient: string) {
    const root = document.documentElement;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-light', colors.primaryLight);
    root.style.setProperty('--primary-dark', colors.primaryDark);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-light', colors.secondaryLight);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-light', colors.accentLight);
    root.style.setProperty('--bg-sidebar', sidebarGradient);
}

function clearThemeFromDOM() {
    const root = document.documentElement;
    const props = ['--primary', '--primary-light', '--primary-dark', '--secondary',
        '--secondary-light', '--accent', '--accent-light', '--bg-sidebar'];
    props.forEach(p => root.style.removeProperty(p));
}

// Build sidebar gradient from a primary color
export function buildSidebarGradient(primaryDark: string, primary: string, primaryLight: string) {
    return `linear-gradient(180deg, ${primaryDark} 0%, ${primary} 50%, ${primaryLight} 100%)`;
}

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useTheme() {
    const [themeId, setThemeId] = useState<string>(() => {
        return localStorage.getItem(THEME_STORAGE_KEY) || 'oxford-navy';
    });
    const [customColors, setCustomColors] = useState<ThemeColors>(() => {
        try {
            const stored = localStorage.getItem(CUSTOM_THEME_KEY);
            return stored ? JSON.parse(stored) : THEME_PRESETS[0].colors;
        } catch {
            return THEME_PRESETS[0].colors;
        }
    });

    // Apply theme whenever themeId or customColors change
    useEffect(() => {
        if (themeId === 'custom') {
            const gradient = buildSidebarGradient(customColors.primaryDark, customColors.primary, customColors.primaryLight);
            applyThemeToDOM(customColors, gradient);
        } else {
            const preset = THEME_PRESETS.find(t => t.id === themeId);
            if (preset) {
                applyThemeToDOM(preset.colors, preset.sidebarGradient);
            } else {
                clearThemeFromDOM();
            }
        }
    }, [themeId, customColors]);

    const selectTheme = useCallback((id: string) => {
        setThemeId(id);
        localStorage.setItem(THEME_STORAGE_KEY, id);
    }, []);

    const updateCustomColors = useCallback((colors: Partial<ThemeColors>) => {
        setCustomColors(prev => {
            const merged = { ...prev, ...colors };
            localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(merged));
            return merged;
        });
        setThemeId('custom');
        localStorage.setItem(THEME_STORAGE_KEY, 'custom');
    }, []);

    const currentPreset = THEME_PRESETS.find(t => t.id === themeId);

    return {
        themeId,
        currentPreset,
        customColors,
        selectTheme,
        updateCustomColors,
        presets: THEME_PRESETS,
        isCustom: themeId === 'custom',
    };
}
