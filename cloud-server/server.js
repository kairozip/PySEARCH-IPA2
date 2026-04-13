/**
 * Chrome Killer Cloud — optional Express API (JWT auth + encrypted sync vault + dashboard static).
 * Run: cd cloud-server && npm install && npm start
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const PORT = Number(process.env.PORT) || 3847;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
const STORE_PATH = path.resolve(process.env.DATA_PATH || path.join(__dirname, 'data', 'store.json'));

function loadStore() {
    if (!fs.existsSync(STORE_PATH)) {
        const dir = path.dirname(STORE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return { users: {} };
    }
    try {
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (e) {
        return { users: {} };
    }
}

function saveStore(store) {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function authMiddleware(req, res, next) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing bearer token' });
    }
    try {
        const payload = jwt.verify(h.slice(7), JWT_SECRET);
        req.userId = payload.sub;
        req.userEmail = payload.email;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

app.post('/auth/register', async (req, res) => {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const store = loadStore();
    const exists = Object.values(store.users).some((u) => u.email === email.toLowerCase());
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const id = uuidv4();
    const hash = await bcrypt.hash(String(password), 10);
    store.users[id] = {
        id,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        passwordHash: hash,
        vault: null,
        vaultUpdatedAt: 0,
        devices: []
    };
    saveStore(store);
    const token = jwt.sign({ sub: id, email: store.users[id].email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id, email: store.users[id].email, name: store.users[id].name } });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const store = loadStore();
    const user = Object.values(store.users).find((u) => u.email === email.toLowerCase());
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/me', authMiddleware, (req, res) => {
    const store = loadStore();
    const u = store.users[req.userId];
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ id: u.id, email: u.email, name: u.name, vaultUpdatedAt: u.vaultUpdatedAt });
});

app.get('/devices', authMiddleware, (req, res) => {
    const store = loadStore();
    const u = store.users[req.userId];
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ devices: u.devices || [] });
});

app.post('/sync/upload', authMiddleware, (req, res) => {
    const { vault, deviceId, updatedAt } = req.body || {};
    const store = loadStore();
    const u = store.users[req.userId];
    if (!u) return res.status(404).json({ error: 'User not found' });
    const incoming = Number(updatedAt) || Date.now();
    const cur = Number(u.vaultUpdatedAt) || 0;
    if (vault && incoming >= cur) {
        u.vault = vault;
        u.vaultUpdatedAt = incoming;
    }
    if (deviceId) {
        u.devices = (u.devices || []).filter((d) => d.id !== deviceId);
        u.devices.push({ id: deviceId, lastSeen: Date.now() });
    }
    saveStore(store);
    res.json({ ok: true, vaultUpdatedAt: u.vaultUpdatedAt });
});

app.get('/sync/download', authMiddleware, (req, res) => {
    const store = loadStore();
    const u = store.users[req.userId];
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ vault: u.vault || null, updatedAt: u.vaultUpdatedAt || 0 });
});

function safeParseAgentJson(text) {
    const t = String(text || '').trim();
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    try {
        return JSON.parse(t.slice(start, end + 1));
    } catch (e) {
        return null;
    }
}

app.post('/ai-agent', async (req, res) => {
    const { text, context } = req.body || {};
    const prompt = String(text || '').trim();
    if (!prompt) {
        return res.json({ message: 'Empty prompt.', actions: [], source: 'server' });
    }

    if (process.env.OPENAI_API_KEY) {
        try {
            const r = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    temperature: 0.2,
                    messages: [
                        {
                            role: 'system',
                            content:
                                'You are a browser assistant. Reply with ONLY valid JSON: {"message":"string","actions":[]}. ' +
                                'Each action: {"tool":"open_tab|close_tab|switch_tab|bookmark_page|search|summarize_page|list_tabs","args":{}}. ' +
                                'No code, no markdown, no extra text.'
                        },
                        {
                            role: 'user',
                            content: `User request: ${prompt}\nContext: ${JSON.stringify(context || {})}`
                        }
                    ]
                })
            });
            if (!r.ok) {
                const err = await r.text();
                return res.json({ message: 'AI provider error.', actions: [], source: 'openai-error', error: err });
            }
            const data = await r.json();
            const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            const parsed = safeParseAgentJson(content);
            if (parsed && typeof parsed.message === 'string' && Array.isArray(parsed.actions)) {
                return res.json({ ...parsed, source: 'openai' });
            }
            return res.json({ message: String(content || 'Unparseable AI response.'), actions: [], source: 'openai-raw' });
        } catch (e) {
            return res.json({ message: 'AI request failed.', actions: [], source: 'openai-fail', error: e.message });
        }
    }

    const lower = prompt.toLowerCase();
    const actions = [];
    const urlMatch = prompt.match(/https?:\/\/[^\s]+/i);
    if (urlMatch && (lower.includes('open') || lower.includes('tab'))) {
        actions.push({ tool: 'open_tab', args: { url: urlMatch[0] } });
    }
    if (lower.includes('list') && lower.includes('tab')) {
        actions.push({ tool: 'list_tabs', args: {} });
    }
    res.json({
        message: actions.length
            ? 'Parsed safe actions (server mock). Confirm in the browser.'
            : 'No automatic action matched. Try a URL or “list tabs”.',
        actions,
        source: 'server-mock'
    });
});

app.get('/health', (_req, res) => res.json({ ok: true, service: 'chrome-killer-cloud' }));

app.listen(PORT, () => {
    console.log(`Chrome Killer Cloud listening on http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/`);
});
