import UIKit
import WebKit

/**
 * WebViewController
 *
 * Hosts the School Fee Management web application inside a WKWebView.
 * Controls pinch-zoom behaviour in response to:
 *   1. A stored preference (UserDefaults key: "zoomEnabled").
 *   2. A native Settings toggle (call configureZoom() from your UI).
 *   3. A postMessage from the web layer (zoom-change event).
 *
 * The web ↔ native sync strategy:
 *   - Web toggles zoom → viewport meta updated in browser; no native call needed
 *     unless you want the pinch gesture recogniser to match.
 *   - Native toggles zoom → inject JS postMessage so the web layer updates its
 *     viewport meta and localStorage, keeping everything in sync.
 */
class WebViewController: UIViewController {

    private var webView: WKWebView!

    // UserDefaults key that mirrors the web app's localStorage key.
    private let userDefaultsKeyZoom = "zoomEnabled"

    override func viewDidLoad() {
        super.viewDidLoad()

        setupWebView()

        // Read the persisted zoom preference (default: enabled).
        let zoomEnabled = UserDefaults.standard.object(forKey: userDefaultsKeyZoom) as? Bool ?? true
        configureZoom(enabled: zoomEnabled)

        let url = URL(string: "https://your-app-url.com")! // replace with your URL
        webView.load(URLRequest(url: url))
    }

    // MARK: - Setup

    private func setupWebView() {
        let config = WKWebViewConfiguration()

        // Register a script message handler so the web app can call:
        //   window.webkit.messageHandlers.zoomBridge.postMessage({ enabled: true })
        // (Optional – only needed if you want web → native communication for zoom.)
        config.userContentController.add(self, name: "zoomBridge")

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self

        view.addSubview(webView)

        // Pin webView to the safe area
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
    }

    // MARK: - Zoom control

    /**
     * Enables or disables pinch-zoom in the WKWebView and injects JavaScript
     * to update the viewport meta tag inside the web content.
     *
     * @param enabled    true = allow pinch-zoom, false = disable pinch-zoom
     * @param notifyWeb  set to false when the call originates from the web
     *                   layer (postMessage) to avoid an infinite loop.
     */
    func configureZoom(enabled: Bool, notifyWeb: Bool = true) {
        // Toggle the native pinch gesture recogniser on the scroll view.
        // This works for WKWebView running inside the app; it has no effect
        // when the content is running as a standalone PWA on the home screen.
        webView.scrollView.pinchGestureRecognizer?.isEnabled = enabled

        // Persist to UserDefaults so the setting survives app restarts.
        UserDefaults.standard.set(enabled, forKey: userDefaultsKeyZoom)

        if notifyWeb {
            // Notify the web layer so it updates the viewport meta tag and its
            // own localStorage – keeps native and web perfectly in sync.
            let js = """
            (function() {
                // The main.tsx message listener will update viewport meta + localStorage.
                window.postMessage({ type: 'zoom-change', enabled: \(enabled) }, '*');
            })();
            """
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}

// MARK: - WKNavigationDelegate

extension WebViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Re-apply the zoom preference after each navigation so that the
        // viewport meta tag is always correct (important for hard reloads).
        let zoomEnabled = UserDefaults.standard.object(forKey: userDefaultsKeyZoom) as? Bool ?? true
        // notifyWeb: false because the page just loaded fresh JS which will
        // call applyZoom(getZoomEnabled()) on its own from main.tsx.
        configureZoom(enabled: zoomEnabled, notifyWeb: false)
    }
}

// MARK: - WKScriptMessageHandler (web -> native zoom bridge, optional)

extension WebViewController: WKScriptMessageHandler {
    /**
     * Called when the web app posts a message via:
     *   window.webkit.messageHandlers.zoomBridge.postMessage({ enabled: true })
     *
     * Use this if you want the web toggle to also control the native pinch
     * gesture recogniser (e.g. in apps where the web toggle is the primary UI).
     */
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "zoomBridge",
              let body = message.body as? [String: Any],
              let enabled = body["enabled"] as? Bool
        else { return }

        // notifyWeb: false – the message came FROM the web; don't echo back.
        configureZoom(enabled: enabled, notifyWeb: false)
    }
}
