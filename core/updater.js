const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let started = false;

/**
 * Auto-update (electron-updater). Requires build.publish in package.json and
 * release artifacts + latest.yml (or equivalent) hosted at that URL.
 * Set PYSEARCH_UPDATE_URL at runtime to override generic provider URL.
 */
function initAutoUpdater(getMainWindow) {
    if (started) return;
    if (!app.isPackaged) {
        return;
    }
    started = true;

    const override = process.env.PYSEARCH_UPDATE_URL || process.env.CHROME_KILLER_UPDATE_URL;
    if (override) {
        try {
            autoUpdater.setFeedURL({ provider: 'generic', url: override.replace(/\/$/, '') });
        } catch (e) {
            console.warn('Updater: invalid PYSEARCH_UPDATE_URL', e.message);
        }
    }

    autoUpdater.autoDownload = true;
    autoUpdater.allowDowngrade = false;

    autoUpdater.on('error', (err) => {
        console.warn('Auto-updater:', err && (err.message || err));
    });

    autoUpdater.on('update-available', (info) => {
        const win = getMainWindow && getMainWindow();
        if (win && !win.isDestroyed()) {
            win.webContents.send('update-status', { state: 'available', version: info.version });
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        const win = getMainWindow && getMainWindow();
        dialog
            .showMessageBox(win && !win.isDestroyed() ? win : undefined, {
                type: 'info',
                title: 'Update ready',
                message: `PySearch ${info.version} has been downloaded.`,
                detail: 'Restart now to finish installing the update.',
                buttons: ['Restart', 'Later'],
                defaultId: 0,
                cancelId: 1
            })
            .then(({ response }) => {
                if (response === 0) {
                    autoUpdater.quitAndInstall(false, true);
                }
            })
            .catch(() => {});
    });

    autoUpdater.on('update-not-available', () => {
        const win = getMainWindow && getMainWindow();
        if (win && !win.isDestroyed()) {
            win.webContents.send('update-status', { state: 'none' });
        }
    });

    setTimeout(() => {
        autoUpdater.checkForUpdates().catch(() => {});
    }, 4000);
}

function checkForUpdatesManual() {
    if (!app.isPackaged) {
        return Promise.resolve({ ok: false, message: 'Updates only apply to installed builds.' });
    }
    return autoUpdater
        .checkForUpdates()
        .then((r) => ({
            ok: true,
            version: r && r.updateInfo && r.updateInfo.version
        }))
        .catch((e) => ({ ok: false, message: e.message }));
}

module.exports = { initAutoUpdater, checkForUpdatesManual };
