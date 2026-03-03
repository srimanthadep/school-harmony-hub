import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../hooks/usePWA';

/**
 * Floating install banner shown at the bottom of every page (including the
 * login page) when the browser fires `beforeinstallprompt`.  This makes the
 * "Add to Home Screen" action discoverable on Android Chrome/Edge without
 * requiring the user to already be logged in or to look in the topbar.
 */
export default function InstallPromptBanner() {
    const { isInstallable, installApp } = usePWA();
    const [dismissed, setDismissed] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Hide banner when already running as an installed PWA.
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true);
        }
    }, []);

    const handleInstall = async () => {
        await installApp();
    };

    if (isStandalone || dismissed || !isInstallable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                    color: 'white',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    zIndex: 10000,
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
                }}
                role="banner"
                aria-label="Install app banner"
            >
                <img
                    src="/logo.png"
                    alt="Oxford School App Logo"
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>Install Oxford School App</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Add to home screen for quick access</div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInstall}
                    style={{
                        background: 'white',
                        color: '#1a237e',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 14px',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    ⬇️ Install
                </motion.button>
                <button
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss install banner"
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 28,
                        height: 28,
                        cursor: 'pointer',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                >
                    ×
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
