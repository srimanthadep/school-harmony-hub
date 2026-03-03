import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

// Capture the event at module level so it is never missed regardless of when
// React components mount (e.g. before auth / lazy-loading completes).
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
const _subscribers = new Set<() => void>();

window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    _subscribers.forEach(fn => fn());
});

window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    _subscribers.forEach(fn => fn());
});

export function usePWA() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(_deferredPrompt);
    const isInstallable = !!installPrompt;

    useEffect(() => {
        const sync = () => setInstallPrompt(_deferredPrompt);
        _subscribers.add(sync);
        // Sync in case the event already fired before this component mounted.
        sync();
        return () => { _subscribers.delete(sync); };
    }, []);

    const installApp = async () => {
        if (!installPrompt) return;

        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            _deferredPrompt = null;
            setInstallPrompt(null);
        }
    };

    return { isInstallable, installApp };
}
