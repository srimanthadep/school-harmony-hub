/**
 * Viewport / Zoom Utility
 *
 * Manages the <meta name="viewport"> tag so that pinch-zoom behaviour is
 * consistent across:
 *   - Normal browser tab
 *   - PWA / Add-to-Home-Screen (web)
 *   - Android native WebView  (also controlled via Kotlin – see android/WebViewActivity.kt)
 *   - iOS WKWebView           (also controlled via Swift  – see ios/WebViewController.swift)
 *
 * The localStorage key "zoomEnabled" persists the user preference as a
 * boolean string ("true" / "false").  Default is enabled (true).
 */

export const ZOOM_STORAGE_KEY = 'zoomEnabled';

/** Viewport content strings */
const VIEWPORT_ZOOM_ON =
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes';
const VIEWPORT_ZOOM_OFF =
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no';

/**
 * Returns the current zoom preference from localStorage.
 * Defaults to true (zoom enabled) when no value has been stored yet.
 */
export function getZoomEnabled(): boolean {
    const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
    // Default: zoom enabled
    return stored === null ? true : stored === 'true';
}

/**
 * Updates (or creates) the <meta name="viewport"> tag and persists the
 * preference to localStorage.
 *
 * Safe to call from both the React layer and the postMessage handler so that
 * native → web sync does not require a page reload.
 *
 * @param enabled  true = zoom allowed, false = zoom locked
 * @param persist  set to false when the call originates from native code that
 *                 has already stored the value, to avoid redundant writes.
 */
export function applyZoom(enabled: boolean, persist = true): void {
    // Find existing tag or create a new one
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
    }

    meta.content = enabled ? VIEWPORT_ZOOM_ON : VIEWPORT_ZOOM_OFF;

    if (persist) {
        localStorage.setItem(ZOOM_STORAGE_KEY, String(enabled));
    }
}
