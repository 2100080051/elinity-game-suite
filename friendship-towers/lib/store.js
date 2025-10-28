const store = globalThis.__towers || { sessions: new Map() };
if(!globalThis.__towers) globalThis.__towers = store;
const { getQuestion, makeBlocks, reflectTower } = require('./architect');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

function newSession(){
  const id = uid();
  const session = { id, title:'', players:[], theme:'Gratitude', palette:'Sunset Glow', started:false, round:0, question:null, tower:[] };
  store.sessions.set(id, session);
  return { sessionId: id };
}

function getState(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  return { id:s.id, title:s.title, players:s.players, theme:s.theme, palette:s.palette, started:s.started, round:s.round, question:s.question, tower:s.tower };
}

async function startSession(sessionId, { players=[], theme='Gratitude', palette='Sunset Glow' }){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.players = Array.from(new Set(players.filter(Boolean)));
  s.theme = theme; s.palette = palette; s.started = true; s.round = 1; s.title = `${theme} Floor`;
  s.question = await getQuestion(theme, s.round);
  return getState(sessionId);
}

async function submitAnswers(sessionId, answers){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const blocks = await makeBlocks(answers||[]);
  // Merge same round answers into a single layer preview (avg color not trivial; keep last color and list names)
  if(blocks.length){
    const label = blocks.map(b=>b.label).slice(0,2).join(' • ');
    const names = blocks.flatMap(b=>b.names||[]);
    const color = blocks[blocks.length-1].color;
    s.tower.push({ color, label, names });
  }
  return getState(sessionId);
}

async function nextLayer(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.round += 1; s.title = `${s.theme} Floor ${s.round}`;
  s.question = await getQuestion(s.theme, s.round);
  return getState(sessionId);
}

function saveSnapshot(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const snapshot = { title:s.title, players:s.players, theme:s.theme, palette:s.palette, round:s.round, tower:s.tower };
  return { ok:true, snapshot };
}

async function reflect(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  return await reflectTower(s.tower||[]);
}

module.exports = { newSession, getState, startSession, submitAnswers, nextLayer, saveSnapshot, reflect };
