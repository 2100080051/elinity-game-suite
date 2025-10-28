// In-memory store for sessions and saved fortunes (per dev server instance)
const { chat, buildFortunePrompt } = require('./openrouter');

const store = globalThis.__fortuneStore || { sessions: new Map() };
if (!globalThis.__fortuneStore) globalThis.__fortuneStore = store;

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function getOrCreateSession(id) {
  let s = store.sessions.get(id);
  if (!s) {
    s = { id, createdAt: Date.now(), history: [], lastFortune: null };
    store.sessions.set(id, s);
  }
  return s;
}

function startSession() {
  const id = uid();
  const session = getOrCreateSession(id);
  return { id: session.id, createdAt: session.createdAt };
}

function localFortune({ mood, situation, intention }) {
  const starters = [
    'A soft current guides you',
    'Stars hum a quiet verse',
    'A lantern flickers open',
    'From the hush of skies',
    'At the edge of dawn'
  ];
  const middles = [
    'toward small, brave choices',
    'to the door you already hold',
    'into a path of gentle abundance',
    'past the fog of doubt',
    'where your patience blooms'
  ];
  const moods = [mood, intention, situation].filter(Boolean).slice(0, 2).join(', ');
  const s = starters[Math.floor(Math.random()*starters.length)];
  const m = middles[Math.floor(Math.random()*middles.length)];
  return `${s}\n${m}${moods ? ' — ' + moods : ''}.`;
}

async function getFortune(sessionId, { mood, situation, intention }) {
  const session = getOrCreateSession(sessionId);
  let text;
  try {
    const user = buildFortunePrompt({ mood, situation, intention });
    text = await chat([{ role: 'user', content: user }]);
  } catch (e) {
    text = localFortune({ mood, situation, intention });
  }
  const fortune = { text: String(text || '').trim(), createdAt: Date.now(), meta: { mood, situation, intention } };
  session.lastFortune = fortune;
  return fortune;
}

async function interpretFortune(sessionId, reflection) {
  const session = getOrCreateSession(sessionId);
  const base = session.lastFortune?.text || 'Offer a gentle insight.';
  let text;
  try {
    text = await chat([
      { role: 'user', content: `Fortune:\n${base}\n\nQuestion or reflection:\n${reflection}\n\nOffer a short, kind clarification (1-2 lines).`}
    ]);
  } catch (e) {
    text = 'Listen for the small yes inside. One clear action will appear.';
  }
  return { text: String(text || '').trim(), createdAt: Date.now() };
}

function saveFortune(sessionId) {
  const session = getOrCreateSession(sessionId);
  if (!session.lastFortune) {
    return { ok: false, error: 'No fortune to save.' };
  }
  const entry = { ...session.lastFortune, id: uid() };
  session.history.unshift(entry);
  return { ok: true, entry };
}

function getHistory(sessionId) {
  const session = getOrCreateSession(sessionId);
  return { history: session.history.slice(0, 50) };
}

module.exports = {
  startSession,
  getFortune,
  interpretFortune,
  saveFortune,
  getHistory,
};
