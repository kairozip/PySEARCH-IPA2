# PySearch iOS

SwiftUI + WKWebView iPhone browser app port of the existing desktop PySearch concept.

## Project structure
- `PySearchiOS.xcodeproj` - Xcode project.
- `PySearchiOS/Views` - SwiftUI screens and sheets.
- `PySearchiOS/Browser` - WKWebView wrappers.
- `PySearchiOS/Models` - Tab, bookmark, history, and settings models.
- `PySearchiOS/ViewModels` - ObservableObject state management.
- `PySearchiOS/Services` - Search resolver, persistence, ad block, plugins, voice service.
- `BUILD_AND_INSTALL.md` - step-by-step `.ipa` build and install guide.

## Feature coverage
- URL + search query detection.
- Multi-tab create/close/switch.
- Back/forward/reload controls.
- Customizable start page URL.
- Bookmarks + history persistence (UserDefaults).
- Settings page (search engine, dark mode, clear data, advanced toggles).
- iPhone-style bottom browser chrome with blur and rounded UI.
- Swipe gesture for tab switching.
- Pull-to-refresh in web content.
- Optional AI panel placeholder.
- Optional ad-block host filtering.
- Optional extension-like plugin JS loader.
- Optional voice-search service scaffold.
