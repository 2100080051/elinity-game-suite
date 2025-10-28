const store = globalThis.__myth || { sessions: new Map(), codex: [] };
if (!globalThis.__myth) globalThis.__myth = store;
const { roundIntro, weaveBeast, THEMES } = require('./weaver_fixed');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

function newSession(){
  const id = uid();
  const session = { id, round: 1, theme: THEMES[0], intro: '', players: [], traits: {}, beast: null, name: '', alignment: '', rarity: '', lore: '', updatedAt: Date.now() };
  store.sessions.set(id, session);
  return { sessionId: id };
}

function join(sessionId, name){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const pid = uid(); const player = { id: pid, name: String(name||'Scribe').slice(0,32) };
  s.players.push(player); s.updatedAt = Date.now();
  return { playerId: pid };
}

function getState(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const traitsList = Object.entries(s.traits).map(([pid, t])=>({ playerId: pid, ...t }));
  return { id:s.id, round:s.round, theme:s.theme, intro:s.intro, players:s.players, traits:traitsList, beast:s.beast, name:s.name, rarity:s.rarity, alignment:s.alignment, lore:s.lore, codexCount: store.codex.length, updatedAt: s.updatedAt };
}

async function setTheme(sessionId, theme){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const ri = await roundIntro(theme);
  s.theme = ri.theme; s.intro = ri.intro; s.updatedAt = Date.now();
  return getState(sessionId);
}

function submitTraits(sessionId, playerId, traits){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const safe = {
    body: String(traits?.body||'').slice(0,200),
    power: String(traits?.power||'').slice(0,200),
    origin: String(traits?.origin||'').slice(0,200),
    emotion: String(traits?.emotion||'').slice(0,80),
  };
  s.traits[playerId] = safe; s.updatedAt = Date.now();
  return { ok:true };
}

async function summonBeast(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  // merge all player traits into one
  const merged = { body:'', power:'', origin:'', emotion:'' };
  Object.values(s.traits).forEach(t=>{
    if(t.body) merged.body += (merged.body? '; ':'') + t.body;
    if(t.power) merged.power += (merged.power? '; ':'') + t.power;
    if(t.origin) merged.origin += (merged.origin? '; ':'') + t.origin;
    if(t.emotion) merged.emotion += (merged.emotion? '; ':'') + t.emotion;
  });
  const pkt = await weaveBeast(merged);
  // Pick a default name suggestion if any
  const defaultName = Array.isArray(pkt.suggestedNames) && pkt.suggestedNames[0] ? pkt.suggestedNames[0] : '';
  s.beast = {
    theme: s.theme,
    summary: pkt.summary||'',
    appearance: pkt.appearance||'',
    powers: pkt.powers||'',
    weaknesses: pkt.weaknesses||'',
    symbolism: pkt.symbolism||'',
    lore: pkt.lore||'',
    rarity: pkt.rarity||'Legendary',
    alignment: pkt.alignment||'Neutral Guardian',
    visual: pkt.visual||{ caption:'', alt:'' }
  };
  s.name = defaultName; s.rarity = s.beast.rarity; s.alignment = s.beast.alignment; s.lore = s.beast.lore; s.updatedAt = Date.now();
  return getState(sessionId);
}

function nameBeast(sessionId, name){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.name = String(name||'').slice(0,80); s.updatedAt = Date.now();
  return getState(sessionId);
}

function addToCodex(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const entry = {
    id: uid(),
    sessionId, round: s.round, theme: s.theme,
    name: s.name||'Unnamed', rarity: s.rarity, alignment: s.alignment,
    beast: s.beast,
    traits: s.traits,
    createdAt: Date.now()
  };
  store.codex.unshift(entry);
  // prepare next round
  s.round += 1; s.traits = {}; s.beast = null; s.name=''; s.lore=''; s.updatedAt = Date.now();
  return { ok:true, entry };
}

function getCodex(){ return { codex: store.codex.slice(0,100) }; }

module.exports = { newSession, join, getState, setTheme, submitTraits, summonBeast, nameBeast, addToCodex, getCodex };
