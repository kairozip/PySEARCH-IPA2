# Core (main process)

- **`bootstrap.js`** — Electron app entry: window creation, session partitions (normal + incognito), downloads, IPC handlers, extension import, settings, migration, navigation resolution.

Feature-specific logic lives under `features/`, `extension-runtime/`, `ai/`, and `sync/`; this file wires them together.

The repository root **`main.js`** only requires `./core/bootstrap` so the packaged app entry stays stable for `electron-builder`.
