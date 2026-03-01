import { useState, useEffect } from 'react';
import { applyZoom, getZoomEnabled, ZOOM_STORAGE_KEY } from '../utils/zoom';

/**
 * useZoom – React hook for the pinch-zoom toggle.
 *
 * Pattern mirrors useDarkMode.ts: reads the persisted preference on first
 * render and exposes a toggle function that updates both the DOM and
 * localStorage atomically.
 *
 * Also listens for StorageEvents so that the toggle UI stays in sync when
 * the native postMessage bridge updates the preference (see main.tsx).
 */
export function useZoom() {
    const [zoomEnabled, setZoomEnabled] = useState<boolean>(() => getZoomEnabled());

    useEffect(() => {
        // Apply viewport setting whenever the state changes
        applyZoom(zoomEnabled);
    }, [zoomEnabled]);

    // Keep the toggle in sync when the native layer updates localStorage via
    // the postMessage bridge (main.tsx fires a synthetic StorageEvent).
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === ZOOM_STORAGE_KEY && e.newValue !== null) {
                setZoomEnabled(e.newValue === 'true');
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    /**
     * Programmatically set zoom (used by the postMessage bridge so native
     * platforms can sync state into the web layer without a full page reload).
     */
    const setZoom = (enabled: boolean) => {
        setZoomEnabled(enabled);
        // applyZoom will be triggered via the useEffect above
    };

    return {
        zoomEnabled,
        toggleZoom: () => setZoom(!zoomEnabled),
        setZoom,
    };
}
