/**
 * Safe tool planner: returns JSON actions only (no code execution).
 * Used when CHROME_KILLER_AI_URL is unset or server fails.
 */

const ALLOWED_TOOLS = new Set([
    'open_tab',
    'close_tab',
    'switch_tab',
    'bookmark_page',
    'search',
    'summarize_page',
    'list_tabs'
]);

function extractUrl(text) {
    const m = String(text).match(/https?:\/\/[^\s]+/i);
    return m ? m[0] : null;
}

function runAgent(payload) {
    const text = String((payload && payload.text) || '').trim();
    const lower = text.toLowerCase();
    const actions = [];

    if (!text) {
        return { message: 'Ask something or describe what you want to do in the browser.', actions: [], source: 'mock' };
    }

    const url = extractUrl(text);
    if (url && (lower.includes('open') || lower.includes('tab') || lower.includes('go to'))) {
        actions.push({ tool: 'open_tab', args: { url } });
    }

    if (lower.includes('close') && lower.includes('tab')) {
        actions.push({ tool: 'close_tab', args: { id: null } });
    }

    if (lower.includes('list') && lower.includes('tab')) {
        actions.push({ tool: 'list_tabs', args: {} });
    }

    if (lower.includes('search') && !url) {
        const q = text.replace(/^search\s+/i, '').trim();
        if (q) actions.push({ tool: 'search', args: { query: q } });
    }

    if (lower.includes('bookmark') || lower.includes('save this page')) {
        actions.push({ tool: 'bookmark_page', args: {} });
    }

    if (lower.includes('summarize') || lower.includes('summary')) {
        actions.push({ tool: 'summarize_page', args: {} });
    }

    const safe = actions.filter((a) => a && ALLOWED_TOOLS.has(a.tool));

    let message = 'Here is what I can do (confirm each step in the browser).';
    if (!safe.length) {
        message =
            'I did not match a safe browser action. Try: “open https://example.com”, “list tabs”, “search cats”, or “summarize page”.';
    }

    return { message, actions: safe, source: 'mock' };
}

module.exports = { runAgent, ALLOWED_TOOLS };
