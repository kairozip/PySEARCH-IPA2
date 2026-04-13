/**
 * Applies VPN / proxy settings from settings.json to an Electron session.
 * Matches ui/renderer.js vpnProxy shape: enabled, scheme, host, port, username, password.
 */

function buildProxyRules(vpn) {
    const host = String(vpn.host || '').trim();
    const port = String(vpn.port || '').trim();
    if (!host) return null;

    const user = String(vpn.username || '').trim();
    const pass = String(vpn.password || '');
    let auth = '';
    if (user) {
        auth = `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`;
    }

    const isSocks = vpn.scheme === 'socks5';
    const hostPort = port ? `${host}:${port}` : host;

    if (isSocks) {
        return `socks5://${auth}${hostPort}`;
    }

    // HTTP proxy: route HTTP and HTTPS through the same proxy
    const core = auth ? `http://${auth}${hostPort}` : `http://${hostPort}`;
    return `http=${core};https=${core}`;
}

/**
 * @param {Electron.Session} sess
 * @param {object} settings
 * @param {string} _userData
 */
function applyProxyToSession(sess, settings, _userData) {
    const vpn = (settings && settings.vpnProxy) || {};
    const enabled = !!vpn.enabled;
    const rules = enabled ? buildProxyRules(vpn) : null;

    if (!rules) {
        sess.setProxy({ mode: 'system' }).catch(() => {});
        return;
    }

    sess
        .setProxy({
            mode: 'fixed_servers',
            proxyRules: rules,
            proxyBypassRules: 'localhost,127.0.0.1,<-loopback>'
        })
        .catch(() => {});
}

module.exports = { applyProxyToSession };
