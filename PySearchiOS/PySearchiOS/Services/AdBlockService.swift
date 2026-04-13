import Foundation

final class AdBlockService {
    private let blockedHosts: [String] = [
        "google-analytics.com",
        "googletagmanager.com",
        "doubleclick.net",
        "googlesyndication.com",
        "adservice.google",
        "ads-twitter.com",
        "ads.linkedin.com",
        "taboola.com",
        "outbrain.com",
        "criteo.com",
        "quantserve.com",
        "hotjar.com"
    ]

    func shouldBlock(url: URL?) -> Bool {
        guard let host = url?.host?.lowercased() else { return false }
        return blockedHosts.contains(where: { host.contains($0) })
    }
}
