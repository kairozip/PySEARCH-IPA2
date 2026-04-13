import SwiftUI
import WebKit

struct BrowserView: UIViewRepresentable {
    let webView: WKWebView
    let tabID: UUID
    @ObservedObject var viewModel: BrowserViewModel

    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel: viewModel, tabID: tabID)
    }

    func makeUIView(context: Context) -> WKWebView {
        webView.navigationDelegate = context.coordinator
        let refresh = UIRefreshControl()
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.pullToRefresh), for: .valueChanged)
        webView.scrollView.refreshControl = refresh
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        context.coordinator.tabID = tabID
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        private let viewModel: BrowserViewModel
        var tabID: UUID

        init(viewModel: BrowserViewModel, tabID: UUID) {
            self.viewModel = viewModel
            self.tabID = tabID
        }

        @objc func pullToRefresh(_ sender: UIRefreshControl) {
            viewModel.reloadCurrentTab()
            sender.endRefreshing()
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if viewModel.shouldBlock(url: navigationAction.request.url) {
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            viewModel.setLoading(tabID: tabID, loading: true)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            viewModel.didFinishNavigation(tabID: tabID, title: webView.title, url: webView.url)
            viewModel.injectPluginsIfNeeded(webView: webView)
        }
    }
}
