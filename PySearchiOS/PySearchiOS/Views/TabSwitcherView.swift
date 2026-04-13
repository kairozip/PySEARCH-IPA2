import SwiftUI

struct TabSwitcherView: View {
    @EnvironmentObject var viewModel: BrowserViewModel

    var body: some View {
        NavigationStack {
            List(viewModel.tabs) { tab in
                Button {
                    viewModel.switchTab(to: tab.id)
                } label: {
                    VStack(alignment: .leading) {
                        Text(tab.title).lineLimit(1)
                        Text(tab.urlString).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
            }
            .navigationTitle("Tabs")
        }
    }
}
