import SwiftUI

@main
struct PySearchiOSApp: App {
    @StateObject private var viewModel = BrowserViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(viewModel)
        }
    }
}
