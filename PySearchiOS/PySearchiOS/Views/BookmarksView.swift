import SwiftUI

struct BookmarksView: View {
    @EnvironmentObject var viewModel: BrowserViewModel

    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.bookmarks) { bookmark in
                    Button(bookmark.title) {
                        guard let url = URL(string: bookmark.urlString) else { return }
                        viewModel.navigate(url: url)
                    }
                }
            }
            .navigationTitle("Bookmarks")
        }
    }
}
