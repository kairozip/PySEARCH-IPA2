const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const ExtensionsService = require('../extension-runtime/extensions-service');
const MigrationUtils = require('../features/migration-utils');
const SearchService = require('../features/search');
const PrivacyService = require('../features/privacy');
const { applyProxyToSession } = require('../features/network-settings');
const extract = require('extract-zip');
const { registerAgentIpc } = require('../ai/register-ipc');
const { registerSyncIpc } = require('../sync/register-ipc');
const { resolveWindowIconPath } = require('./app-icon');

if (process.platform === 'win32') {
    try {
        app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization');
    } catch (e) {}
}

let mainWindow;

// ── PERSISTENCE (2026 UPDATE) ──────────────────────────────
// This ensures cookies, storage, and sessions are saved.
const PARTITION = 'persist:pysearch';
/** In-memory partition (no persist: prefix) — incognito isolation */
const PARTITION_INCOGNITO = 'incognito';

let blockAdsEnabled = true;

function getSettingsPath() {
    return path.join(app.getPath('userData'), 'settings.json');
}

function readSettingsFromDisk() {
    const p = getSettingsPath();
    if (!fs.existsSync(p)) return {};
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
        return {};
    }
}

function applyPrivacyAndNetworkFromSettings(s) {
    s = s || {};
    blockAdsEnabled = s.privacy?.adblockEnabled !== false;
    const ud = app.getPath('userData');
    applyProxyToSession(session.fromPartition(PARTITION), s, ud);
    applyProxyToSession(session.fromPartition(PARTITION_INCOGNITO), s, ud);
}

function setupBrowserSession(partitionName) {
    const sess = session.fromPartition(partitionName);
    sess.on('will-download', (event, item, webContents) => {
        const downloadItem = {
            id: Date.now(),
            name: item.getFilename(),
            url: item.getURL(),
            status: 'progressing',
            received: 0,
            total: item.getTotalBytes(),
            path: '',
            timestamp: Date.now()
        };
        saveDownload(downloadItem);

        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
                updateDownloadStatus(downloadItem.id, 'interrupted');
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    updateDownloadStatus(downloadItem.id, 'paused');
                } else {
                    updateDownloadProgress(downloadItem.id, item.getReceivedBytes());
                }
            }
        });

        item.once('done', (event, state) => {
            if (state === 'completed') {
                updateDownloadStatus(downloadItem.id, 'completed', item.getSavePath());
            } else {
                updateDownloadStatus(downloadItem.id, 'failed');
            }
        });
    });

    sess.webRequest.onBeforeRequest((details, callback) => {
        if (blockAdsEnabled && PrivacyService.shouldBlock(details.url)) {
            if (mainWindow) mainWindow.webContents.send('privacy-blocked', PrivacyService.getBlockedCount());
            return callback({ cancel: true });
        }
        callback({ cancel: false });
    });
}

function createWindow() {
  const winIcon = resolveWindowIconPath(ROOT);
  const winOpts = {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0b0b0d',
    title: 'PySearch Browser',
    webPreferences: {
      preload: path.join(ROOT, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      // Default session mapping for main window
      partition: PARTITION
    }
  };
  if (winIcon) winOpts.icon = winIcon;
  mainWindow = new BrowserWindow(winOpts);

  mainWindow.loadFile(path.join(ROOT, 'ui', 'browser.html'));
  mainWindow.maximize();

  setupBrowserSession(PARTITION);
  setupBrowserSession(PARTITION_INCOGNITO);

  // Update copyright year in console
  console.log('PySearch Browser - © 2026 PySearch');
}

const SHORTCUT_ACTION_CHANNELS = {
    back: 'go-back',
    forward: 'go-forward',
    refresh: 'refresh-page',
    'new-tab': 'new-tab',
    home: 'go-home',
    'close-tab': 'close-tab',
    settings: 'open-settings',
    info: 'open-info',
    search: 'toggle-search-overlay',
    'tab-switcher': 'toggle-tab-switcher',
    'save-html': 'save-page-as-html',
    'toggle-ai': 'toggle-ai-sidebar'
};

ipcMain.on('shortcut-action', (event, action) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const channel = SHORTCUT_ACTION_CHANNELS[action];
    if (channel) mainWindow.webContents.send(channel);
});

app.whenReady().then(() => {
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.pysearch.browser');
    }
    applyPrivacyAndNetworkFromSettings(readSettingsFromDisk());
    createWindow();
    try {
        const { initAutoUpdater } = require('./updater');
        initAutoUpdater(() => mainWindow);
    } catch (e) {
        console.warn('Auto-updater not active:', e.message);
    }
});

ipcMain.on('perform-save-as-html', async (event, { html, title }) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Save Page As HTML',
        defaultPath: path.join(app.getPath('downloads'), `${title || 'page'}.html`),
        filters: [{ name: 'HTML Files', extensions: ['html'] }]
    });
    if (filePath) fs.writeFileSync(filePath, html);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC HANDLERS ──────────────────────────────────────────

// Extensions
ipcMain.handle('get-extensions', async () => {
    const extDir = path.join(ROOT, 'extensions');
    return ExtensionsService.loadExtensions(extDir, app.getPath('userData'));
});

function sanitizeExtensionId(name) {
    return String(name || 'extension').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 64) || 'extension';
}

function findManifestRoot(dir) {
    try {
        if (fs.existsSync(path.join(dir, 'manifest.json'))) return dir;
        const subs = fs.readdirSync(dir);
        for (const s of subs) {
            const p = path.join(dir, s);
            if (fs.statSync(p).isDirectory()) {
                const found = findManifestRoot(p);
                if (found) return found;
            }
        }
    } catch (e) {}
    return null;
}

ipcMain.handle('import-extension-zip', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Import extension (.zip)',
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
        properties: ['openFile']
    });
    if (!filePaths || !filePaths[0]) return { success: false };
    const tmp = path.join(app.getPath('temp'), `pysearch-ext-${Date.now()}`);
    fs.mkdirSync(tmp, { recursive: true });
    try {
        await extract(filePaths[0], { dir: tmp });
        const extRoot = findManifestRoot(tmp);
        if (!extRoot) {
            fs.rmSync(tmp, { recursive: true, force: true });
            return { success: false, error: 'No manifest.json found in the archive.' };
        }
        const manifest = JSON.parse(fs.readFileSync(path.join(extRoot, 'manifest.json'), 'utf8'));
        if (!fs.existsSync(path.join(extRoot, 'content.js'))) {
            fs.rmSync(tmp, { recursive: true, force: true });
            return { success: false, error: 'Extension requires content.js next to manifest.json.' };
        }
        const id = sanitizeExtensionId(manifest.name || path.basename(filePaths[0], '.zip'));
        const dest = path.join(ROOT, 'extensions', id);
        if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.cpSync(extRoot, dest, { recursive: true });
        fs.rmSync(tmp, { recursive: true, force: true });
        ExtensionsService.setEnabled(app.getPath('userData'), id, true);
        return { success: true, id };
    } catch (e) {
        try {
            fs.rmSync(tmp, { recursive: true, force: true });
        } catch (err) {}
        return { success: false, error: e.message || 'Import failed.' };
    }
});

ipcMain.handle('set-extension-enabled', (event, extId, enabled) => {
    ExtensionsService.setEnabled(app.getPath('userData'), extId, !!enabled);
    return true;
});

ipcMain.handle('delete-extension', (event, extId) => {
    const extDir = path.join(ROOT, 'extensions');
    ExtensionsService.deleteExtension(extDir, app.getPath('userData'), extId);
    return true;
});

ipcMain.on('clear-incognito-session', () => {
    const sess = session.fromPartition(PARTITION_INCOGNITO);
    sess.clearStorageData({ storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage'] }).catch(() => {});
    sess.clearCache().catch(() => {});
});

// History Logic
const historyPath = path.join(app.getPath('userData'), 'history.json');
ipcMain.handle('get-history', async () => {
    if (!fs.existsSync(historyPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (e) { return []; }
});

ipcMain.on('save-history', (event, item) => {
    if (item && item.incognito) return;
    let history = [];
    if (fs.existsSync(historyPath)) {
        try { history = JSON.parse(fs.readFileSync(historyPath, 'utf8')); } catch(e){}
    }
    history.unshift({ ...item, timestamp: Date.now() });
    // Keep last 100 items
    history = history.slice(0, 100);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
});

ipcMain.handle('clear-history', async () => {
    if (fs.existsSync(historyPath)) fs.unlinkSync(historyPath);
    return true;
});

// Downloads Logic
const downloadsPath = path.join(app.getPath('userData'), 'downloads.json');
function saveDownload(item) {
    let list = [];
    if (fs.existsSync(downloadsPath)) {
        try { list = JSON.parse(fs.readFileSync(downloadsPath, 'utf8')); } catch(e){}
    }
    list.unshift(item);
    fs.writeFileSync(downloadsPath, JSON.stringify(list, null, 2));
}

function updateDownloadStatus(id, status, savePath = '') {
    if (!fs.existsSync(downloadsPath)) return;
    let list = JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
    let item = list.find(d => d.id === id);
    if (item) {
        item.status = status;
        if (savePath) item.path = savePath;
        fs.writeFileSync(downloadsPath, JSON.stringify(list, null, 2));
    }
}

function updateDownloadProgress(id, received) {
    if (!fs.existsSync(downloadsPath)) return;
    let list = JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
    let item = list.find(d => d.id === id);
    if (item) {
        item.received = received;
        fs.writeFileSync(downloadsPath, JSON.stringify(list, null, 2));
    }
}

ipcMain.handle('get-downloads', async () => {
    if (!fs.existsSync(downloadsPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(downloadsPath, 'utf8'));
    } catch (e) { return []; }
});

// Downloads Folder
ipcMain.on('open-downloads', () => {
    const downloads = app.getPath('downloads');
    require('electron').shell.openPath(downloads);
});

ipcMain.on('open-path', (event, p) => {
    if (p) require('electron').shell.openPath(p);
});

// Window controls
ipcMain.on('window-minimize', () => mainWindow && mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow && mainWindow.close());

// ── PATHS (2026) ──────────────────────────────────────────
ipcMain.handle('get-app-paths', () => {
    // Robust file path conversion for Windows
    const getPath = (f) => {
        const p = path.join(ROOT, 'ui', f);
        return 'file:///' + p.replace(/\\/g, '/');
    };

    return {
        newTab: getPath('newtab.html'),
        history: getPath('history.html'),
        downloads: getPath('downloads.html'),
        extensions: getPath('extensions.html'),
        preload: path.join(ROOT, 'preload.js')
    };
});

// ── CUSTOMIZATION (2026) ──────────────────────────────────
ipcMain.handle('get-settings', () => readSettingsFromDisk());

ipcMain.on('save-settings', (event, settings) => {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
    applyPrivacyAndNetworkFromSettings(settings);

    // Broadcast to all windows and webviews
    const { webContents } = require('electron');
    webContents.getAllWebContents().forEach(wc => {
        try { wc.send('settings-updated', settings); } catch(e){}
    });
});

function upgradeGoogleAvatarUrl(u) {
    if (!u || typeof u !== 'string') return u;
    if (!u.includes('googleusercontent.com')) return u;
    return u.replace(/=s\d+-[a-z]$/i, '=s256-c').replace(/=s\d+$/i, '=s256-c');
}

ipcMain.on('google-profile-detected', (event, data) => {
    if (!data || !data.url) return;
    try {
        let settings = {};
        const sp = getSettingsPath();
        if (fs.existsSync(sp)) settings = JSON.parse(fs.readFileSync(sp, 'utf8'));
        settings.userProfile = settings.userProfile || {};
        settings.userProfile.avatarUrl = upgradeGoogleAvatarUrl(data.url);
        if (data.email) settings.userProfile.email = data.email;
        fs.writeFileSync(sp, JSON.stringify(settings, null, 2));
        
        // Broadcast update
        const { webContents } = require('electron');
        webContents.getAllWebContents().forEach(wc => {
            try { wc.send('settings-updated', settings); } catch(e){}
        });
    } catch(e) {}
});

// ── MIGRATION (2026) ──────────────────────────────────────
ipcMain.handle('detect-browsers', async () => MigrationUtils.detectBrowsers());

ipcMain.handle('import-browsers', async (event, browserKeys) => {
    const partitionPath = path.join(app.getPath('userData'), 'Partitions', 'persist:pysearch');
    try {
        return await MigrationUtils.importFromBrowsers(Array.isArray(browserKeys) ? browserKeys : [], partitionPath);
    } catch (e) {
        return { count: 0, errors: [e.message] };
    }
});

ipcMain.handle('import-from-browser', async (event, browserKey) => {
    try {
        const partitionPath = path.join(app.getPath('userData'), 'Partitions', 'persist:pysearch');
        return await MigrationUtils.importData(browserKey, partitionPath);
    } catch (e) {
        return { error: e.message };
    }
});
ipcMain.handle('export-data', async () => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Export PySearch Data',
        defaultPath: path.join(app.getPath('downloads'), 'pysearch_backup.json'),
        filters: [{ name: 'JSON', extensions: ['json'] }]
    });
    if (!filePath) return { success: false };
    return await MigrationUtils.exportData(app.getPath('userData'), filePath);
});

ipcMain.handle('import-data', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Import PySearch Data',
        filters: [{ name: 'JSON', extensions: ['json'] }],
        properties: ['openFile']
    });
    if (!filePaths || filePaths.length === 0) return { success: false };
    const result = MigrationUtils.importBundleFromJson(filePaths[0], app.getPath('userData'));
    if (result.success) {
        app.relaunch();
        app.exit(0);
    }
    return result;
});

ipcMain.handle('resolve-navigation-url', (event, input) => SearchService.process(input));

ipcMain.handle('check-for-updates', async () => {
    try {
        const { checkForUpdatesManual } = require('./updater');
        return await checkForUpdatesManual();
    } catch (e) {
        return { ok: false, message: e.message };
    }
});

registerAgentIpc({ getMainWindow: () => mainWindow });
registerSyncIpc({ getMainWindow: () => mainWindow, readSettingsFromDisk });
