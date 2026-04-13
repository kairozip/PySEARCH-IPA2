# Chromium migration roadmap

This Electron app is structured so core logic can move toward a **Chromium-based** shell later without a big-bang rewrite. **No Chromium code ships in this repository today.**

## Target architecture (future)

| Layer | Today (Electron) | Future (Chromium fork) |
|--------|-------------------|-------------------------|
| UI | `ui/*.html` + `renderer.js` | Same HTML/JS in **WebUI** or native views |
| Tabs / navigation | Renderer owns `<webview>` | **Browser** / **TabStripModel** in C++ |
| Extension runtime | `extension-runtime/` + `executeJavaScript` | **Extensions** component (`chrome.*` APIs) |
| Network / proxy | `session` + `features/network-settings.js` | **NetworkContext** / proxy config in browser |
| Privacy / adblock | `features/privacy.js` + `webRequest` | **WebRequest API** or network service filters |
| AI agent | `ai/` + IPC | Same JSON tool protocol; executor in browser process |
| Sync | `sync/` + optional `cloud-server/` | Same encrypted vault; upload from browser process |
| Main entry | `core/bootstrap.js` | **Browser process** entry + mojo interfaces |

## How to obtain Chromium source

1. Install [depot_tools](https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md) (Windows/Linux/macOS).
2. Create a workspace and fetch Chromium (see official **“Get the code”** for your OS).
3. Use `gclient sync` and generate build files with `gn` for your target (e.g. `out/Default`).

Official entry points:

- [Chromium: Get the code](https://www.chromium.org/developers/how-tos/get-the-code/)
- [Building Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/windows_build_instructions.md) (Windows)
- [Linux build](https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md)

## Replacing the Electron shell

1. **Browser process**: Owns windows, tabs, profiles, and policy. Maps to today’s `core/bootstrap.js` responsibilities (without `BrowserWindow` from Electron).
2. **Renderer**: One renderer per tab (or OOPIF as Chromium does). Your current **tab strip** UI becomes either:
   - **WebUI** pages loaded from `chrome://` resources, or
   - Native UI (Views) if you need maximum performance.
3. **Guest content**: Replace `<webview>` with normal Chromium tabs loading `content::WebContents`.

## Porting subsystems

### Tabs and navigation

- Map `newTab` / `switchTab` / `closeTab` in `ui/renderer.js` to `TabStripModel::AppendWebContents`, `ActivateTabAt`, `CloseWebContentsAt`.
- Keep a **single internal tab id** concept; Chromium uses `WebContents` pointers and tab indices.

### Extensions

- Today: `extension-runtime/extensions-service.js` reads `manifest.json` + `content.js` and injects script strings.
- Future: Package extensions as CRX / unpacked dirs; implement a **minimal subset** of `manifest v2/v3` in the extensions service, or embed the full Chromium extensions stack.

### AI agent (`ai/`)

- Keep the contract: **structured JSON actions only**, validated in the **browser process** before any navigation.
- Mojo or IPC from renderer → browser for `ExecuteAgentAction(tool, args)`.

### Sync (`sync/` + `cloud-server/`)

- Unchanged wire format: **client-side AES** vault, server stores opaque `vault` string.
- Move encryption helpers to a shared library (C++ or Rust) if both browser and utilities need them.

### Privacy / search / migration

- `features/privacy.js` + blocklist → URL loader interceptors or `WebRequest` rules.
- `features/search.js` / `bangs` → omnibox handler in browser process.
- `features/migration-utils.js` → optional; desktop-only tooling can stay a sidecar.

## Practical migration order

1. Freeze **public contracts**: IPC names, sync vault format, agent JSON schema.
2. Extract **pure JS** (search, bangs, blocklist) into packages with no Electron imports.
3. Introduce a **thin `BrowserApi` interface** in the renderer (implemented by Electron today, stubbed for Chromium later).
4. Prototype **one tab** in a minimal Chromium embed before porting the full UI.

## What not to do early

- Do not depend on Node in the renderer in new code; prefer IPC to a small Node or native service if needed.
- Do not let the AI layer execute strings as code; keep the current **whitelist + confirm** model.

This document is the single source of truth for “Electron → Chromium” planning in this repo.
