# PySearch iOS Build + Install Guide

## 1) Open in Xcode (on Mac)
1. Copy the `PySearchiOS` folder to a Mac with Xcode 16+.
2. Open `PySearchiOS/PySearchiOS.xcodeproj`.
3. In target `PySearch` -> `Signing & Capabilities`:
   - Select your Apple Team.
   - Set a unique bundle identifier (example: `com.yourname.pysearch.ios`).

## 2) Run on iPhone
1. Connect your iPhone by cable.
2. Select your iPhone as the run destination.
3. Press Run.
4. On iPhone, if prompted, trust your developer certificate:
   - `Settings` -> `General` -> `VPN & Device Management` -> Trust your profile.

## 3) Archive and export .ipa
1. In Xcode, select `Any iOS Device (arm64)` as destination.
2. Go to `Product` -> `Archive`.
3. In Organizer, select the archive.
4. Click `Distribute App`.
5. Choose:
   - `Development` for sideload/testing, or
   - `App Store Connect` for App Store/TestFlight.
6. Export to generate the `.ipa`.

## 4) Install .ipa
- For development `.ipa`, use:
  - Apple Configurator (Mac), or
  - TestFlight (if uploaded), or
  - Xcode install during Run.

## Notes
- Required iOS permissions already declared:
  - Speech recognition (`NSSpeechRecognitionUsageDescription`).
- Browser data persistence uses `UserDefaults`.
- Start page, search engine, dark mode, ad blocker, and plugin toggles are in app settings.
