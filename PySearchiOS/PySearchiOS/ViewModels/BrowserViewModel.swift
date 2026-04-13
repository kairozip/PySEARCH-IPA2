import Foundation
import SwiftUI
import WebKit

final class BrowserViewModel: ObservableObject {
    @Published var tabs: [BrowserTab] = [BrowserTab()]
    @Published var selectedTabID: UUID?
    @Published var addressInput: String = ""
    @Published var bookmarks: [BookmarkItem]
    @Published var history: [HistoryItem]
    @Published var settings: BrowserSettings
    @Published var showBookmarks = false
    @Published var showHistory = false
    @Published var showSettings = false
    @Published var showAI = false
    @Published var showTabs = false

    let webViewStore = WebViewStore()
    private let persistence = PersistenceService()
    private let adBlock = AdBlockService()
    private let pluginLoader = PluginLoaderService()
    private let plugins: [BrowserPlugin]

    init() {
        bookmarks = persistence.loadBookmarks()
        history = persistence.loadHistory()
        settings = persistence.loadSettings()
        selectedTabID = tabs.first?.id
        plugins = pluginLoader.loadPlugins()
    }

    var selectedTab: BrowserTab? {
        tabs.first(where: { $0.id == selectedTabID })
    }

    func openInitialPageIfNeeded() {
        guard let tab = selectedTab else { return }
        if tab.urlString == "pysearch://start", let url = URL(string: settings.startPageURLString) {
            navigate(url: url)
        }
    }

    func navigateFromInput() {
        guard let resolved = SearchResolver.resolve(addressInput, engine: settings.selectedSearchEngine) else { return }
        navigate(url: resolved)
    }

    func navigate(url: URL) {
        guard let selectedTabID else { return }
        let webView = webViewStore.webView(for: selectedTabID)
        webView.load(URLRequest(url: url))
        updateTab(id: selectedTabID) { tab in
            tab.urlString = url.absoluteString
        }
        addressInput = url.absoluteString
    }

    func goBack() { activeWebView?.goBack() }
    func goForward() { activeWebView?.goForward() }
    func reloadCurrentTab() { activeWebView?.reload() }

    func addTab() {
        let tab = BrowserTab()
        tabs.append(tab)
        selectedTabID = tab.id
        addressInput = ""
    }

    func closeCurrentTab() {
        guard let selectedTabID, tabs.count > 1 else { return }
        tabs.removeAll { $0.id == selectedTabID }
        webViewStore.removeWebView(for: selectedTabID)
        self.selectedTabID = tabs.first?.id
        addressInput = selectedTab?.urlString == "pysearch://start" ? "" : (selectedTab?.urlString ?? "")
    }

    func switchTab(to tabID: UUID) {
        selectedTabID = tabID
        addressInput = selectedTab?.urlString == "pysearch://start" ? "" : (selectedTab?.urlString ?? "")
    }

    func switchTabBySwipe(left: Bool) {
        guard let selectedTabID, let currentIndex = tabs.firstIndex(where: { $0.id == selectedTabID }) else { return }
        let nextIndex = left ? currentIndex + 1 : currentIndex - 1
        guard tabs.indices.contains(nextIndex) else { return }
        switchTab(to: tabs[nextIndex].id)
    }

    func toggleBookmark() {
        guard let tab = selectedTab, tab.urlString != "pysearch://start" else { return }
        if let index = bookmarks.firstIndex(where: { $0.urlString == tab.urlString }) {
            bookmarks.remove(at: index)
        } else {
            bookmarks.insert(BookmarkItem(title: tab.title, urlString: tab.urlString), at: 0)
        }
        persistence.saveBookmarks(bookmarks)
    }

    func setLoading(tabID: UUID, loading: Bool) {
        updateTab(id: tabID) { $0.isLoading = loading }
    }

    func didFinishNavigation(tabID: UUID, title: String?, url: URL?) {
        updateTab(id: tabID) { tab in
            tab.isLoading = false
            tab.title = title?.isEmpty == false ? title! : "Untitled"
            tab.urlString = url?.absoluteString ?? tab.urlString
        }

        if let urlString = url?.absoluteString, !urlString.isEmpty {
            addressInput = urlString
            history.insert(HistoryItem(title: title ?? urlString, urlString: urlString), at: 0)
            history = Array(history.prefix(300))
            persistence.saveHistory(history)
        }
    }

    func shouldBlock(url: URL?) -> Bool {
        settings.adBlockEnabled && adBlock.shouldBlock(url: url)
    }

    func injectPluginsIfNeeded(webView: WKWebView) {
        guard settings.pluginsEnabled else { return }
        plugins.forEach { webView.evaluateJavaScript($0.injectedJavaScript, completionHandler: nil) }
    }

    func saveSettings() {
        persistence.saveSettings(settings)
    }

    func clearAllData() {
        bookmarks = []
        history = []
        persistence.clearAllData()
    }

    private var activeWebView: WKWebView? {
        guard let selectedTabID else { return nil }
        return webViewStore.webView(for: selectedTabID)
    }

    private func updateTab(id: UUID, update: (inout BrowserTab) -> Void) {
        guard let index = tabs.firstIndex(where: { $0.id == id }) else { return }
        update(&tabs[index])
    }
}
