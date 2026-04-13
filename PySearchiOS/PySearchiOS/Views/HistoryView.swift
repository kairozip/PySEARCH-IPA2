import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var viewModel: BrowserViewModel
    @State private var search = ""

    var filtered: [HistoryItem] {
        guard !search.isEmpty else { return viewModel.history }
        return viewModel.history.filter {
            $0.title.localizedCaseInsensitiveContains(search) || $0.urlString.localizedCaseInsensitiveContains(search)
        }
    }

    var body: some View {
        NavigationStack {
            List(filtered) { item in
                Button {
                    guard let url = URL(string: item.urlString) else { return }
                    viewModel.navigate(url: url)
                } label: {
                    VStack(alignment: .leading) {
                        Text(item.title).lineLimit(1)
                        Text(item.urlString).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                    }
                }
            }
            .searchable(text: $search)
            .navigationTitle("History")
        }
    }
}
