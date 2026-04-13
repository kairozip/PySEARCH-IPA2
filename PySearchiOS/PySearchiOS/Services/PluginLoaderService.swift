import Foundation

struct BrowserPlugin: Identifiable, Codable {
    let id: UUID
    let name: String
    let injectedJavaScript: String
}

final class PluginLoaderService {
    func loadPlugins() -> [BrowserPlugin] {
        // Basic extension-like system: loads static plugins shipped in-app.
        [
            BrowserPlugin(
                id: UUID(),
                name: "Reader Highlight",
                injectedJavaScript: "document.body.style.setProperty('--pysearch-reader', '1');"
            )
        ]
    }
}
