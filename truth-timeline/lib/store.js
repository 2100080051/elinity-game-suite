const store = globalThis.__truth || { sessions: new Map() };
if (!globalThis.__truth) globalThis.__truth = store;
const { getPrompt, getAwakening, summarizeEntry, snapshot, reflect, connect } = require('./curator');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-3); }

function newSession(){
  const id = uid();
  const session = {
    id,
    title: 'Untitled Timeline',
    players: [],
    moods: new Map(), // playerId -> mood
    phase: 'awakening', // awakening|past|present|future|connect
    entries: [],
    currentPrompt: null,
    connection: null,
    reflections: [],
    updatedAt: Date.now()
  };
  store.sessions.set(id, session);
  return { sessionId: id };
}

function join(sessionId, name){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const pid = uid(); const player = { id: pid, name: String(name||'Traveler').slice(0,40) };
  s.players.push(player); s.updatedAt = Date.now();
  return { playerId: pid };
}

function getState(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const moods = Array.from(s.moods.entries()).map(([playerId,mood])=>({ playerId, mood }));
  return {
    id:s.id,
    title:s.title,
    phase:s.phase,
    players:s.players,
    moods,
    entries:s.entries.slice(-100),
    currentPrompt:s.currentPrompt,
    connection:s.connection,
    reflections:s.reflections.slice(-10),
    updatedAt:s.updatedAt,
    allowedMoods: ['serenity','passion','growth','mystery']
  };
}

async function nextPrompt(sessionId, preferred){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.currentPrompt = await getPrompt(preferred || s.currentPrompt?.zone);
  s.updatedAt = Date.now();
  return getState(sessionId);
}

async function submitEntry(sessionId, playerId, { zone, year, content }){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const p = s.players.find(x=>x.id===playerId); if(!p) throw new Error('No player');
  // Zone determined by phase unless explicitly provided
  const phaseZoneMap = { past:'past', present:'present', future:'future' };
  const z = (zone||phaseZoneMap[s.phase]||s.currentPrompt?.zone||'present');
  const cleanYear = String(year||'').slice(0,16) || null;
  const text = String(content||'').trim().slice(0,500);
  if (!text) return { ok:false };
  const sum = await summarizeEntry(z, cleanYear, text);
  const entry = { id: uid(), playerId, playerName: p.name, zone: z, year: cleanYear, content: text, ai_summary: sum.ai_summary, at: Date.now() };
  s.entries.push(entry); s.updatedAt = Date.now();
  return { ok:true, entry };
}

async function makeSnapshot(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const pkt = await snapshot(s.title, s.entries);
  s.updatedAt = Date.now();
  return pkt;
}

async function makeReflection(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const pkt = await reflect(s.entries);
  if (pkt) s.reflections.push({ ...pkt, at: Date.now() });
  s.updatedAt = Date.now();
  return pkt;
}

function saveTitle(sessionId, title){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.title = String(title||'Untitled Timeline').slice(0,80);
  s.updatedAt = Date.now();
  return getState(sessionId);
}

function setMood(sessionId, playerId, mood){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const allowed = new Set(['serenity','passion','growth','mystery']);
  if (!allowed.has((mood||'').toLowerCase())) throw new Error('Invalid mood');
  s.moods.set(playerId, (mood||'').toLowerCase());
  s.updatedAt = Date.now();
  return getState(sessionId);
}

async function nextPhase(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const order = ['awakening','past','present','future','connect'];
  const idx = Math.max(0, order.indexOf(s.phase));
  const next = order[Math.min(order.length-1, idx+1)];
  s.phase = next;
  if (next === 'awakening') {
    s.currentPrompt = await getAwakening();
  } else if (next === 'past' || next === 'present' || next === 'future') {
    s.currentPrompt = await getPrompt(next);
  } else if (next === 'connect') {
    s.currentPrompt = { phase:'connect', zone:null, prompt:'Share any last notes, then press Snapshot or Reflection.' };
    s.connection = await connect(s.entries);
  }
  s.updatedAt = Date.now();
  return getState(sessionId);
}

module.exports = { newSession, join, getState, nextPrompt, submitEntry, makeSnapshot, makeReflection, saveTitle, setMood, nextPhase };
