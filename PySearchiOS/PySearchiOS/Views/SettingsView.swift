import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var viewModel: BrowserViewModel

    var body: some View {
        NavigationStack {
            Form {
                Section("Search Engine") {
                    Picker("Default Search", selection: $viewModel.settings.selectedSearchEngine) {
                        ForEach(SearchEngine.allCases) { engine in
                            Text(engine.label).tag(engine)
                        }
                    }
                }

                Section("Start Page") {
                    TextField("Start page URL", text: $viewModel.settings.startPageURLString)
                }

                Section("Appearance") {
                    Toggle("Use system dark mode", isOn: $viewModel.settings.useSystemDarkMode)
                    Toggle("Force dark websites", isOn: $viewModel.settings.forceDarkMode)
                }

                Section("Privacy / Advanced") {
                    Toggle("Ad blocker", isOn: $viewModel.settings.adBlockEnabled)
                    Toggle("Enable plugins", isOn: $viewModel.settings.pluginsEnabled)
                    Toggle("Voice search", isOn: $viewModel.settings.voiceSearchEnabled)
                }

                Section {
                    Button("Clear bookmarks and history", role: .destructive) {
                        viewModel.clearAllData()
                    }
                }
            }
            .navigationTitle("Settings")
            .onDisappear {
                viewModel.saveSettings()
            }
        }
    }
}
