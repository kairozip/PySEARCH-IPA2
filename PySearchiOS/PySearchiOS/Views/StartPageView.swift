import SwiftUI

struct StartPageView: View {
    @EnvironmentObject var viewModel: BrowserViewModel
    @State private var query = ""

    var body: some View {
        VStack(spacing: 16) {
            Text("PySearch")
                .font(.system(size: 36, weight: .bold, design: .rounded))
            Text("Privacy-focused browsing on iPhone")
                .foregroundStyle(.secondary)

            HStack {
                TextField("Search or enter URL", text: $query)
                    .textFieldStyle(.roundedBorder)
                Button("Go") {
                    viewModel.addressInput = query
                    viewModel.navigateFromInput()
                }
            }

            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Recent")
                        .font(.headline)
                    ForEach(viewModel.history.prefix(6)) { item in
                        Button(item.title) {
                            guard let url = URL(string: item.urlString) else { return }
                            viewModel.navigate(url: url)
                        }
                    }
                }
            }
        }
        .padding()
    }
}
