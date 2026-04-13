const { ipcMain } = require('electron');
const { runAgent } = require('./mock-agent');

/**
 * @param {{ getMainWindow: () => import('electron').BrowserWindow | null }} _ctx
 */
function registerAgentIpc(_ctx) {
    ipcMain.handle('ai-agent-query', async (_event, payload) => {
        const base = (process.env.CHROME_KILLER_AI_URL || '').replace(/\/$/, '');
        if (base) {
            try {
                const res = await fetch(`${base}/ai-agent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload || {})
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data === 'object') return data;
                }
            } catch (e) {
                return {
                    message: 'AI server unreachable; using offline planner.',
                    actions: [],
                    source: 'fallback',
                    error: e.message
                };
            }
        }
        return runAgent(payload || {});
    });
}

module.exports = { registerAgentIpc };
