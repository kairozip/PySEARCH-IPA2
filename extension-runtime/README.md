# Extension runtime

- **`extensions-service.js`** — loads unpacked extensions from the app’s `extensions/` directory (`manifest.json` + `content.js`), tracks enable/disable in `extensions-state.json` under userData.

## Chrome-like API (planned / incremental)

Extensions injected into pages today run as raw script. A **Chrome-lite** surface (`chrome.tabs`, `chrome.storage`, `chrome.runtime`) should be provided by:

1. Injecting a small **bootstrap** ahead of `content.js` that exposes `globalThis.chromeKiller` (or `chrome` behind a flag).
2. Bridging to the host via `ipc-message` / preload (host = browser shell), never `eval` of extension-provided strings in the main process.

Permissions: parse `manifest.permissions` and **whitelist** before enabling bridge methods.

## Store (local)

A local extension store can index metadata (name, version, category) in JSON under userData and reuse the existing ZIP import path in `core/bootstrap.js`.

Do not store user secrets inside extension folders; use `chrome.storage` bridge to encrypted userData if needed.
