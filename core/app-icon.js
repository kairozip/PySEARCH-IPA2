const path = require('path');
const fs = require('fs');

/**
 * Best icon for BrowserWindow: prefer ICO (Windows taskbar / window chrome), then PNG with alpha.
 */
function resolveWindowIconPath(rootDir) {
    // OS shell / taskbar: use ICO or PNG with alpha (SVG is unreliable for BrowserWindow on Windows).
    const candidates = [
        path.join(rootDir, 'assets', 'icon.ico'),
        path.join(rootDir, 'assets', 'icon.png'),
        path.join(rootDir, 'assets', 'pysearch_mascot.png')
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return undefined;
}

module.exports = { resolveWindowIconPath };
