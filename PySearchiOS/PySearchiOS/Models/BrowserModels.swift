import Foundation

struct BrowserTab: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var urlString: String
    var isLoading: Bool

    init(id: UUID = UUID(), title: String = "New Tab", urlString: String = "pysearch://start", isLoading: Bool = false) {
        self.id = id
        self.title = title
        self.urlString = urlString
        self.isLoading = isLoading
    }
}

struct BookmarkItem: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var urlString: String
    var createdAt: Date

    init(id: UUID = UUID(), title: String, urlString: String, createdAt: Date = .now) {
        self.id = id
        self.title = title
        self.urlString = urlString
        self.createdAt = createdAt
    }
}

struct HistoryItem: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var urlString: String
    var visitedAt: Date

    init(id: UUID = UUID(), title: String, urlString: String, visitedAt: Date = .now) {
        self.id = id
        self.title = title
        self.urlString = urlString
        self.visitedAt = visitedAt
    }
}

enum SearchEngine: String, CaseIterable, Codable, Identifiable {
    case duckDuckGo
    case google
    case bing

    var id: String { rawValue }

    var label: String {
        switch self {
        case .duckDuckGo: return "DuckDuckGo"
        case .google: return "Google"
        case .bing: return "Bing"
        }
    }
}

struct BrowserSettings: Codable, Equatable {
    var selectedSearchEngine: SearchEngine = .duckDuckGo
    var startPageURLString: String = "https://duckduckgo.com"
    var useSystemDarkMode: Bool = true
    var forceDarkMode: Bool = true
    var adBlockEnabled: Bool = true
    var pluginsEnabled: Bool = true
    var voiceSearchEnabled: Bool = true
}
