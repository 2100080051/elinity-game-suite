const store = globalThis.__rap || { rooms: new Map() };
if (!globalThis.__rap) globalThis.__rap = store;
const { roundIntro, getPrompts, judge } = require('./dj');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-3); }

function newRoom(){
  const id = uid();
  const room = { id, phase: 'lobby', difficulty:'casual', players: [], beat:null, theme:null, bpm:null, intro:null, prompts:[], entries:[], feedback:[], winnerId:null, updatedAt: Date.now() };
  store.rooms.set(id, room);
  return { roomId: id };
}

function joinRoom(roomId, name){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const pid = uid(); const player = { id: pid, name: String(name||'MC').slice(0,32) };
  r.players.push(player); r.updatedAt = Date.now();
  return { playerId: pid };
}

function getState(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  return { id:r.id, phase:r.phase, difficulty:r.difficulty, players:r.players, beat:r.beat, theme:r.theme, bpm:r.bpm, intro:r.intro, prompts:r.prompts, entries:r.entries, feedback:r.feedback, winnerId:r.winnerId, updatedAt:r.updatedAt };
}

function setDifficulty(roomId, difficulty){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const d = (difficulty||'casual').toLowerCase();
  if(!['casual','hard','chaos'].includes(d)) throw new Error('Invalid difficulty');
  r.difficulty = d; r.updatedAt = Date.now();
  return getState(roomId);
}

async function startRound(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const intro = await roundIntro();
  r.beat = intro.beat; r.theme = intro.theme; r.bpm = intro.bpm; r.intro = intro.intro;
  const pp = await getPrompts(r.players, r.difficulty);
  r.prompts = pp.prompts || []; r.entries = []; r.feedback = []; r.winnerId=null; r.phase = 'freestyle'; r.updatedAt = Date.now();
  return getState(roomId);
}

function submit(roomId, playerId, text){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const p = r.players.find(x=>x.id===playerId); if(!p) throw new Error('No player');
  const clean = String(text||'').trim().slice(0,800);
  if(!clean) return { ok:false };
  const existing = r.entries.find(e=>e.playerId===playerId);
  if (existing) { existing.text = clean; existing.at = Date.now(); }
  else r.entries.push({ playerId, name:p.name, text: clean, at: Date.now() });
  r.updatedAt = Date.now();
  return { ok:true };
}

async function doJudge(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  const fb = await judge(r.players, r.entries, r.prompts);
  r.feedback = fb.feedback || []; r.winnerId = fb.winnerId || null; r.phase = 'results'; r.updatedAt = Date.now();
  return getState(roomId);
}

async function nextRound(roomId){
  const r = store.rooms.get(roomId); if(!r) throw new Error('No room');
  r.phase = 'prompt'; r.prompts = []; r.entries = []; r.feedback = []; r.winnerId=null; r.updatedAt = Date.now();
  // immediately go to new intro+prompts on next startRound call
  return getState(roomId);
}

module.exports = { newRoom, joinRoom, getState, setDifficulty, startRound, submit, doJudge, nextRound };
