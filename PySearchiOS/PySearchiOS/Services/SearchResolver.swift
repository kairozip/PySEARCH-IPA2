import Foundation

enum SearchResolver {
    static func resolve(_ input: String, engine: SearchEngine) -> URL? {
        let raw = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !raw.isEmpty else { return nil }

        if let url = URL(string: raw), let scheme = url.scheme, !scheme.isEmpty {
            return url
        }

        let domainPattern = #"^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(/.*)?$"#
        let localhostPattern = #"^localhost(:\d+)?(/.*)?$"#
        if raw.range(of: domainPattern, options: .regularExpression) != nil ||
            raw.range(of: localhostPattern, options: .regularExpression) != nil {
            return URL(string: "https://\(raw)")
        }

        let encoded = raw.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? raw
        switch engine {
        case .google:
            return URL(string: "https://www.google.com/search?q=\(encoded)")
        case .bing:
            return URL(string: "https://www.bing.com/search?q=\(encoded)")
        case .duckDuckGo:
            return URL(string: "https://duckduckgo.com/?q=\(encoded)")
        }
    }
}
