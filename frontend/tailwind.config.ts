import type { Config } from 'tailwindcss';

/** Centralized school brand colors — mirrors the CSS custom properties in index.css */
const schoolColors = {
    primary: {
        DEFAULT: '#1a237e',
        light: '#283593',
        dark: '#0d1b5e',
    },
    secondary: {
        DEFAULT: '#f9a825',
        light: '#ffd54f',
    },
    accent: {
        DEFAULT: '#00897b',
        light: '#4db6ac',
    },
    danger: {
        DEFAULT: '#e53935',
        light: '#ef9a9a',
    },
    success: {
        DEFAULT: '#43a047',
        light: '#a5d6a7',
    },
    warning: '#fb8c00',
    info: '#039be5',
    /** Background shades */
    bg: {
        primary: '#f0f2f8',
        secondary: '#ffffff',
    },
    /** Text shades */
    text: {
        primary: '#1a1f36',
        secondary: '#6b7280',
        muted: '#9ca3af',
    },
    /** Borders */
    border: {
        DEFAULT: '#e2e8f0',
        light: '#f1f5f9',
    },
};

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
    theme: {
        extend: {
            colors: {
                school: schoolColors,
            },
            borderRadius: {
                school: '12px',
            },
        },
    },
    plugins: [],
};

export default config;
