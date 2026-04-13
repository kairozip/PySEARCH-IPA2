import Foundation
import WebKit

final class WebViewStore {
    private(set) var views: [UUID: WKWebView] = [:]
    private let configuration: WKWebViewConfiguration

    init() {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration = config
    }

    func webView(for id: UUID) -> WKWebView {
        if let existing = views[id] { return existing }
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.allowsBackForwardNavigationGestures = true
        views[id] = webView
        return webView
    }

    func removeWebView(for id: UUID) {
        views[id] = nil
    }
}
