import SwiftUI

struct ContentView: View {
    @EnvironmentObject var viewModel: BrowserViewModel

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                if let tab = viewModel.selectedTab {
                    BrowserView(
                        webView: viewModel.webViewStore.webView(for: tab.id),
                        tabID: tab.id,
                        viewModel: viewModel
                    )
                } else {
                    StartPageView()
                }
            }
            .ignoresSafeArea()
            .gesture(
                DragGesture(minimumDistance: 30)
                    .onEnded { value in
                        if value.translation.width < -50 {
                            viewModel.switchTabBySwipe(left: true)
                        } else if value.translation.width > 50 {
                            viewModel.switchTabBySwipe(left: false)
                        }
                    }
            )

            VStack(spacing: 10) {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.secondary)
                    TextField("Search or URL", text: $viewModel.addressInput)
                        .submitLabel(.go)
                        .onSubmit { viewModel.navigateFromInput() }
                    if viewModel.selectedTab?.isLoading == true {
                        ProgressView().controlSize(.small)
                    }
                }
                .padding(.horizontal, 12)
                .frame(height: 42)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 22))

                HStack {
                    Button(action: viewModel.goBack) { Image(systemName: "chevron.left") }
                    Spacer()
                    Button(action: viewModel.goForward) { Image(systemName: "chevron.right") }
                    Spacer()
                    Button(action: viewModel.reloadCurrentTab) { Image(systemName: "arrow.clockwise") }
                    Spacer()
                    Button(action: viewModel.toggleBookmark) { Image(systemName: "bookmark") }
                    Spacer()
                    Button(action: viewModel.addTab) { Image(systemName: "plus.square.on.square") }
                    Spacer()
                    Button(action: viewModel.closeCurrentTab) { Image(systemName: "xmark") }
                    Spacer()
                    Button { viewModel.showSettings = true } label: { Image(systemName: "gearshape") }
                }
                .font(.system(size: 18, weight: .medium))
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 24))
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 8)
        }
        .preferredColorScheme(viewModel.settings.useSystemDarkMode ? nil : (viewModel.settings.forceDarkMode ? .dark : .light))
        .onAppear { viewModel.openInitialPageIfNeeded() }
        .sheet(isPresented: $viewModel.showBookmarks) { BookmarksView().environmentObject(viewModel) }
        .sheet(isPresented: $viewModel.showHistory) { HistoryView().environmentObject(viewModel) }
        .sheet(isPresented: $viewModel.showSettings) { SettingsView().environmentObject(viewModel) }
        .sheet(isPresented: $viewModel.showAI) { AIAssistantView().environmentObject(viewModel) }
        .sheet(isPresented: $viewModel.showTabs) { TabSwitcherView().environmentObject(viewModel) }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Tabs") { viewModel.showTabs = true }
                    Button("Bookmarks") { viewModel.showBookmarks = true }
                    Button("History") { viewModel.showHistory = true }
                    Button("AI Assistant") { viewModel.showAI = true }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
    }
}
