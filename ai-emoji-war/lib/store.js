const store = globalThis.__emoji || { rooms: new Map() };
if (!globalThis.__emoji) globalThis.__emoji = store;
const { getThemes, narrate } = require('./narrator');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-3); }

function newRoom(){
  const id = uid();
  const room = { id, round: 0, theme: '', themes: [], chaos:false, players: [], messages: [], narration:null, leaderboard: new Map(), updatedAt: Date.now() };
  store.rooms.set(id, room);
  return { roomId: id };
}

function joinRoom(roomId, name){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const pid = uid(); const player = { id: pid, name: String(name||'Player').slice(0,40) };
  r.players.push(player); if (!r.leaderboard.has(pid)) r.leaderboard.set(pid, { id: pid, name: player.name, score: 0 });
  r.updatedAt = Date.now();
  return { playerId: pid };
}

function getState(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const lb = Array.from(r.leaderboard.values()).sort((a,b)=>b.score-a.score);
  return { id:r.id, round:r.round, theme:r.theme, themes:r.themes, chaos:r.chaos, players:r.players, messages:r.messages.slice(-50), narration:r.narration, leaderboard: lb, updatedAt:r.updatedAt };
}

async function startRound(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  r.round += 1; r.messages = []; r.narration = null; r.theme=''; r.themes = await getThemes(); r.updatedAt=Date.now();
  return getState(roomId);
}

function pickTheme(roomId, theme){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  r.theme = String(theme||'').slice(0,100);
  r.updatedAt = Date.now();
  return getState(roomId);
}

function emojiOnly(str){
  const s = String(str||'').trim();
  // naive: remove any ASCII letters/digits/punct except emoji range; allow whitespace
  const ascii = /[A-Za-z0-9_\-\.:,;@#\$%&\*\+=\?\!\(\)\[\]\{\}\"\'\<\>]/g;
  return s.replace(ascii,'').trim();
}

function submit(roomId, playerId, emojis){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const p = r.players.find(x=>x.id===playerId); if(!p) throw new Error('No player');
  const clean = emojiOnly(emojis).slice(0,64);
  if (!clean) return { ok:false };
  r.messages.push({ playerId, name:p.name, emojis: clean, at: Date.now() });
  r.updatedAt = Date.now();
  return { ok:true };
}

async function narrateRound(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const theme = r.theme || (r.themes[0]||'Random Chaos');
  const pkt = await narrate(theme, r.messages);
  r.narration = pkt; r.theme = pkt.theme || theme; r.updatedAt = Date.now();
  // score: add creativity+chaos+emotion to each participating player's total
  const roundScore = (pkt?.scores?.creativity||0) + (pkt?.scores?.chaos||0) + (pkt?.scores?.emotion||0);
  const per = Math.max(1, Math.round(roundScore / Math.max(1, new Set(r.messages.map(m=>m.playerId)).size)));
  r.messages.forEach(m=>{ const row = r.leaderboard.get(m.playerId); if(row){ row.score += per; row.name = m.name; }});
  return getState(roomId);
}

function toggleChaos(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  r.chaos = !r.chaos; r.updatedAt = Date.now();
  return getState(roomId);
}

module.exports = { newRoom, joinRoom, getState, startRound, pickTheme, submit, narrateRound, toggleChaos };
