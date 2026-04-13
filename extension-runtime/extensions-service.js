const fs = require('fs');
const path = require('path');

function statePath(userData) {
    return path.join(userData, 'extensions-state.json');
}

function readState(userData) {
    const p = statePath(userData);
    if (!fs.existsSync(p)) return {};
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
        return {};
    }
}

function writeState(userData, state) {
    fs.writeFileSync(statePath(userData), JSON.stringify(state, null, 2));
}

const ExtensionsService = {
    readState,
    writeState,

    loadExtensions(extensionsDir, userData) {
        if (!fs.existsSync(extensionsDir)) return [];

        const st = userData ? readState(userData) : {};
        const extensions = [];
        const items = fs.readdirSync(extensionsDir);

        for (const item of items) {
            const extPath = path.join(extensionsDir, item);
            if (!fs.statSync(extPath).isDirectory()) continue;

            const manifestPath = path.join(extPath, 'manifest.json');
            const contentPath = path.join(extPath, 'content.js');

            if (fs.existsSync(manifestPath) && fs.existsSync(contentPath)) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    const contentScript = fs.readFileSync(contentPath, 'utf8');
                    const enabled = st[item] !== false;
                    extensions.push({
                        name: manifest.name || item,
                        id: item,
                        version: manifest.version || '1.0.0',
                        contentScript,
                        enabled
                    });
                } catch (e) {
                    console.error(`Failed to load extension ${item}:`, e);
                }
            }
        }
        return extensions;
    },

    setEnabled(userData, extId, enabled) {
        const st = readState(userData);
        st[extId] = !!enabled;
        writeState(userData, st);
    },

    deleteExtension(extensionsDir, userData, extId) {
        const folder = path.join(extensionsDir, extId);
        if (fs.existsSync(folder)) {
            fs.rmSync(folder, { recursive: true, force: true });
        }
        const st = readState(userData);
        delete st[extId];
        writeState(userData, st);
    }
};

module.exports = ExtensionsService;
