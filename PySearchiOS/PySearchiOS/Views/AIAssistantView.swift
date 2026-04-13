import SwiftUI

struct AIAssistantView: View {
    @EnvironmentObject var viewModel: BrowserViewModel
    @State private var prompt = ""
    @State private var output = "Ask the assistant to open sites or summarize intent."

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Assistant")
                .font(.headline)
            TextField("Ask...", text: $prompt, axis: .vertical)
                .textFieldStyle(.roundedBorder)
            Button("Run") {
                output = "Prototype assistant response: \(prompt)"
            }
            .buttonStyle(.borderedProminent)
            Text(output)
                .font(.footnote)
                .foregroundStyle(.secondary)
            Spacer()
        }
        .padding()
    }
}
