import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register';
import { applyZoom, getZoomEnabled, ZOOM_STORAGE_KEY } from './utils/zoom';

// ─── Zoom initialisation ──────────────────────────────────────────────────────
// Apply the persisted zoom preference as early as possible so that the
// viewport meta tag is correct before the first render (works in browser,
// PWA, Android WebView and iOS WKWebView).
applyZoom(getZoomEnabled());

// ─── Native → Web postMessage bridge ─────────────────────────────────────────
// Android (Kotlin) and iOS (Swift) can call:
//   webView.evaluateJavascript("window.postMessage({ type:'zoom-change', enabled: true })", null)
// This listener picks that up and updates the viewport + localStorage so both
// layers stay in sync without requiring a reload.
// The `persist` flag is set to true so the preference survives future loads.
window.addEventListener('message', (event: MessageEvent) => {
    if (event.data && event.data.type === 'zoom-change' && typeof event.data.enabled === 'boolean') {
        // Persist to localStorage first so the value is available immediately.
        localStorage.setItem(ZOOM_STORAGE_KEY, String(event.data.enabled));
        // Apply the viewport change; pass persist=false because localStorage is
        // already updated above – avoids a redundant write inside applyZoom.
        applyZoom(event.data.enabled, false);
        // Also fire a storage event so useZoom hook re-reads from localStorage
        // if the hook is already mounted (same-tab update).
        window.dispatchEvent(new StorageEvent('storage', {
            key: ZOOM_STORAGE_KEY,
            newValue: String(event.data.enabled),
        }));
    }
});

const rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
}

const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('New content available. Reload?')) {
            updateSW(true);
        }
    },
    onOfflineReady() {
        console.log('App ready for offline use');
    },
});
