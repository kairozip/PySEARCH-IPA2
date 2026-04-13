# Releasing updates (auto-update bootstrap)

The **installed** Windows app uses **electron-updater**. After `npm run build`, `dist/` contains:

- `PySearch-Setup-x.x.x.exe` (or your configured NSIS name)
- **`latest.yml`** — required for the updater to know the newest version

## 1. Configure your update URL

In **`package.json`**, set `build.publish[0].url` to the **HTTPS** folder where you will host those files, for example:

`https://cdn.example.com/pysearch/win/`

Rebuild so the packaged app embeds this feed URL.

Alternatively, set environment variable **`PYSEARCH_UPDATE_URL`** on end-user machines to the same base URL (no trailing issues: strip trailing `/` in code if needed — server should serve `latest.yml` at `{url}/latest.yml`).

## 2. Upload artifacts

Upload **every** file from `dist/` that belongs to that release (at least the `.exe` and **`latest.yml`**, plus blockmap files if present). Paths must match what `latest.yml` references.

## 3. Bump version

Increase **`version`** in `package.json` before each release so it is newer than what users have.

## 4. User experience

- On startup (packaged app only), the app checks for updates after a short delay.
- If a download completes, a dialog offers **Restart** to install (NSIS installer flow).
- **Settings → Check for updates** runs an extra check (dev builds report that updates apply only to installed apps).

## Taskbar / desktop icon transparency

Use **`assets/icon.ico`** built from a **PNG with alpha** (see `assets/ICON_README.txt`). The in-browser UI uses **`assets/pysearch_mascot.png`**; run **`npm run fix-mascot`** if the PNG still has a baked-in checkerboard.
