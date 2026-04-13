const fs = require('fs');
const path = require('path');

class MigrationUtils {
    static getBrowserPaths() {
        const localAppData = process.env.LOCALAPPDATA;
        const appData = process.env.APPDATA;

        return {
            chrome: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default'),
            edge: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default'),
            brave: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default'),
            firefox: path.join(appData, 'Mozilla', 'Firefox', 'Profiles'),
            opera: path.join(localAppData, 'Opera Software', 'Opera Stable'),
            operagx: path.join(localAppData, 'Opera Software', 'Opera GX Stable')
        };
    }

    /** Parent folder that contains Default / Profile * (Chromium) or profile dirs (Firefox). */
    static getProfileParentForImport(browserKey) {
        const paths = this.getBrowserPaths();
        const p = paths[browserKey];
        if (!p) return null;
        if (browserKey === 'firefox') {
            return fs.existsSync(p) ? p : null;
        }
        if (browserKey === 'opera' || browserKey === 'operagx') {
            return fs.existsSync(p) ? p : null;
        }
        return path.dirname(p);
    }

    /**
     * Detect installed browsers (folder exists).
     */
    static detectBrowsers() {
        const paths = this.getBrowserPaths();
        const labels = {
            chrome: 'Google Chrome',
            edge: 'Microsoft Edge',
            brave: 'Brave',
            firefox: 'Mozilla Firefox',
            opera: 'Opera',
            operagx: 'Opera GX'
        };
        const out = [];
        for (const key of Object.keys(paths)) {
            const base = paths[key];
            const parent = key === 'firefox' ? path.dirname(path.dirname(base)) : path.dirname(base);
            const found = fs.existsSync(parent);
            out.push({
                key,
                name: labels[key] || key,
                found,
                pathHint: parent
            });
        }
        return out;
    }

    static async importData(browserKey, targetPartitionPath) {
        const parentDir = this.getProfileParentForImport(browserKey);
        if (!parentDir || !fs.existsSync(parentDir)) {
            throw new Error(`Could not find ${browserKey} data folder.`);
        }

        const filesToSync = ['Bookmarks', 'History', 'Login Data', 'Web Data', 'Network/Cookies'];
        let count = 0;

        let profiles = [];
        if (browserKey === 'firefox') {
            profiles = fs.readdirSync(parentDir).filter((f) => {
                const fp = path.join(parentDir, f);
                try {
                    return fs.statSync(fp).isDirectory();
                } catch (e) {
                    return false;
                }
            });
        } else {
            profiles = fs.readdirSync(parentDir).filter((f) => f === 'Default' || f.startsWith('Profile '));
        }

        if (profiles.length === 0 && browserKey !== 'firefox') {
            throw new Error(`No browser profiles found for ${browserKey}.`);
        }

        for (const profile of profiles) {
            const sourceProfilePath = path.join(parentDir, profile);
            if (!fs.existsSync(sourceProfilePath)) continue;

            for (const file of filesToSync) {
                const src = path.join(sourceProfilePath, file);
                const dest = path.join(targetPartitionPath, file);

                if (fs.existsSync(src)) {
                    const destDir = path.dirname(dest);
                    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

                    try {
                        fs.copyFileSync(src, dest);
                        count++;
                    } catch (e) {}
                }
            }
        }
        return count;
    }

    /** Import from multiple Chromium-based profiles (best-effort). */
    static async importFromBrowsers(browserKeys, targetPartitionPath) {
        let total = 0;
        const errors = [];
        for (const key of browserKeys) {
            try {
                const n = await this.importData(key, targetPartitionPath);
                total += n;
            } catch (e) {
                errors.push(`${key}: ${e.message}`);
            }
        }
        return { count: total, errors };
    }

    static readJsonSafe(filePath, fallback) {
        if (!fs.existsSync(filePath)) return fallback;
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            return fallback;
        }
    }

    static async exportData(userDataPath, destPath) {
        const historyPath = path.join(userDataPath, 'history.json');
        const settingsPath = path.join(userDataPath, 'settings.json');

        const history = this.readJsonSafe(historyPath, []);
        const settings = this.readJsonSafe(settingsPath, {});

        const bundle = {
            exportedAt: new Date().toISOString(),
            history: Array.isArray(history) ? history : [],
            settings: settings && typeof settings === 'object' ? settings : {}
        };

        fs.writeFileSync(destPath, JSON.stringify(bundle, null, 2));
        return { success: true, count: bundle.history.length };
    }

    static importBundleFromJson(bundlePath, userDataPath) {
        try {
            const raw = fs.readFileSync(bundlePath, 'utf8');
            const bundle = JSON.parse(raw);
            if (!bundle || typeof bundle !== 'object') {
                return { success: false, error: 'Invalid backup file.' };
            }
            const historyPath = path.join(userDataPath, 'history.json');
            const settingsPath = path.join(userDataPath, 'settings.json');
            if (Array.isArray(bundle.history)) {
                fs.writeFileSync(historyPath, JSON.stringify(bundle.history, null, 2));
            }
            if (bundle.settings && typeof bundle.settings === 'object') {
                fs.writeFileSync(settingsPath, JSON.stringify(bundle.settings, null, 2));
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message || 'Import failed.' };
        }
    }
}

module.exports = MigrationUtils;
