package com.example.schoolfeemanagement

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

/**
 * WebViewActivity
 *
 * Hosts the School Fee Management web application inside an Android WebView.
 * Controls pinch-zoom behaviour in response to:
 *   1. A stored preference (SharedPreferences key: "zoomEnabled").
 *   2. A native Settings toggle (call configureZoom() from your UI).
 *   3. A postMessage from the web layer (zoom-change event).
 *
 * The web ↔ native sync strategy:
 *   - Web toggles zoom → viewport meta updated in browser; no native call needed
 *     unless you want native controls (pinch gesture) to match.
 *   - Native toggles zoom → inject JS postMessage so the web layer updates its
 *     viewport meta and localStorage, keeping everything in sync.
 */
class WebViewActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    // SharedPreferences key that mirrors the web app's localStorage key.
    private val PREFS_KEY_ZOOM = "zoomEnabled"
    private val PREFS_NAME    = "AppPrefs"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_webview)  // your layout file

        webView = findViewById(R.id.webView)

        setupWebView()

        // Read the persisted zoom preference (default: enabled).
        val zoomEnabled = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .getBoolean(PREFS_KEY_ZOOM, true)

        configureZoom(zoomEnabled)

        webView.loadUrl("https://your-app-url.com") // replace with your URL
    }

    /**
     * Configures WebView zoom controls and injects JavaScript to update the
     * viewport meta tag inside the web content.
     *
     * @param enabled true = allow pinch-zoom, false = disable pinch-zoom
     * @param notifyWeb  set to false when the call originates from the web
     *                   layer (postMessage) to avoid an infinite loop.
     */
    @SuppressLint("SetJavaScriptEnabled")
    fun configureZoom(enabled: Boolean, notifyWeb: Boolean = true) {
        val settings = webView.settings

        // Enable/disable the native WebView pinch-zoom gesture.
        settings.setSupportZoom(enabled)
        settings.builtInZoomControls = enabled
        // Always hide the on-screen zoom buttons regardless of the setting.
        settings.displayZoomControls = false

        // Persist to SharedPreferences so the setting survives process death.
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .edit()
            .putBoolean(PREFS_KEY_ZOOM, enabled)
            .apply()

        if (notifyWeb) {
            // Notify the web layer so it updates the viewport meta tag and its
            // own localStorage – keeps native and web perfectly in sync.
            val js = """
                (function() {
                    // Send a zoom-change message; the web app's message listener
                    // in main.tsx will update the viewport meta and localStorage.
                    window.postMessage({ type: 'zoom-change', enabled: $enabled }, '*');
                })();
            """.trimIndent()
            // evaluateJavascript is safe on API 19+.
            webView.evaluateJavascript(js, null)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.apply {
            webViewClient = WebViewClient()

            settings.apply {
                javaScriptEnabled = true        // required for the web app
                domStorageEnabled  = true        // required for localStorage
                allowFileAccess    = false
                allowContentAccess = false
            }
        }
    }
}
