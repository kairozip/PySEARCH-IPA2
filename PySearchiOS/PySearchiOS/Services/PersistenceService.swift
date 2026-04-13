import Foundation

final class PersistenceService {
    private let userDefaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private enum Key: String {
        case bookmarks
        case history
        case settings
    }

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
    }

    func loadBookmarks() -> [BookmarkItem] {
        load([BookmarkItem].self, key: .bookmarks) ?? []
    }

    func saveBookmarks(_ bookmarks: [BookmarkItem]) {
        save(bookmarks, key: .bookmarks)
    }

    func loadHistory() -> [HistoryItem] {
        load([HistoryItem].self, key: .history) ?? []
    }

    func saveHistory(_ history: [HistoryItem]) {
        save(history, key: .history)
    }

    func loadSettings() -> BrowserSettings {
        load(BrowserSettings.self, key: .settings) ?? BrowserSettings()
    }

    func saveSettings(_ settings: BrowserSettings) {
        save(settings, key: .settings)
    }

    func clearAllData() {
        [Key.bookmarks, .history].forEach { userDefaults.removeObject(forKey: $0.rawValue) }
    }

    private func save<T: Codable>(_ value: T, key: Key) {
        guard let data = try? encoder.encode(value) else { return }
        userDefaults.set(data, forKey: key.rawValue)
    }

    private func load<T: Codable>(_ type: T.Type, key: Key) -> T? {
        guard let data = userDefaults.data(forKey: key.rawValue) else { return nil }
        return try? decoder.decode(type, from: data)
    }
}
