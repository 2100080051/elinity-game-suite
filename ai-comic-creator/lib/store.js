const store = globalThis.__comic || { sessions: new Map() };
if(!globalThis.__comic) globalThis.__comic = store;
const { confirmSetup, genPanel, ackDialogue, buildIssue } = require('./comic');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

function newSession(){
  const id = uid();
  const session = { id, setup:null, title:'', index:0, dialogues:[], panels:[], finished:false };
  store.sessions.set(id, session);
  return { sessionId: id };
}

function getState(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const current = s.panels[s.index-1] || null;
  return { id:s.id, setup:s.setup, title:s.title, index:s.index, dialogues:s.dialogues, panels:s.panels, current, finished:s.finished };
}

async function setupComic(sessionId, cfg){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const { theme, style, panels, tone } = cfg;
  const conf = await confirmSetup({ theme, style, panels, tone });
  s.setup = { theme, style, panels, tone };
  s.title = conf.title || 'Untitled Issue';
  s.index = 0; s.dialogues = []; s.panels = []; s.finished = false;
  return getState(sessionId);
}

async function generatePanel(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  if(!s.setup) throw new Error('Setup not complete');
  if(s.index >= (s.setup.panels||0)){ s.finished = true; return getState(sessionId); }
  const index = s.index + 1;
  const pkt = await genPanel({ ...s.setup, index });
  const panel = { index, ...pkt, dialogues: [] };
  s.panels.push(panel);
  s.index = index;
  return getState(sessionId);
}

async function regenerateScene(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  if(!s.index) throw new Error('No panel to regenerate');
  const pkt = await genPanel({ ...s.setup, index: s.index });
  const p = s.panels[s.index-1];
  s.panels[s.index-1] = { ...p, ...pkt };
  return getState(sessionId);
}

async function addDialogue(sessionId, text){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  if(!s.index) throw new Error('Generate a panel first');
  const ack = await ackDialogue(text);
  const p = s.panels[s.index-1];
  p.dialogues = p.dialogues || [];
  p.dialogues.push({ text: String(text||'').trim(), ack: ack.note||'' });
  s.dialogues.push({ text: String(text||'').trim(), i: s.index });
  return getState(sessionId);
}

function saveProgress(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const save = { setup:s.setup, title:s.title, index:s.index, panels:s.panels };
  return { ok:true, save };
}

function finishComic(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.finished = true;
  s.issue = buildIssue(s);
  return { ok:true };
}

module.exports = { newSession, getState, setupComic, generatePanel, regenerateScene, addDialogue, saveProgress, finishComic };
