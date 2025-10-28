const store = globalThis.__roasttoast || { games: new Map() };
if (!globalThis.__roasttoast) globalThis.__roasttoast = store;
const { generateRoastPrompt, generateToast, generateSummary } = require('./openrouter');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-3); }

function newGame(){
  const id = uid();
  const game = {
    id,
    round: 0,
    players: [], // {id,name}
    targetId: null,
    prompt: '',
    roasts: [], // {playerId,name,text}
    toast: '',
    hostLog: [], // {type:'intro'|'prompt'|'summary'|'toast'|'applause', text, at}
    introShown: false,
    createdAt: Date.now()
  };
  store.games.set(id, game);
  return { gameId: id };
}

function addPlayer(gameId, name){
  const g = store.games.get(gameId); if(!g) throw new Error('No game');
  const pid = uid();
  const player = { id: pid, name: (name||'Player '+pid.slice(0,4)).trim().slice(0,40) };
  g.players.push(player);
  return { playerId: pid, player };
}

function getState(gameId){
  const g = store.games.get(gameId); if(!g) throw new Error('No game');
  return {
    id: g.id, round: g.round, players: g.players,
    targetId: g.targetId, prompt: g.prompt, roasts: g.roasts, toast: g.toast,
    hostLog: g.hostLog
  };
}

async function startRound(gameId){
  const g = store.games.get(gameId); if(!g) throw new Error('No game');
  if (g.players.length===0) throw new Error('Add players first');
  if (!g.introShown){
    g.hostLog.push({ type:'intro', text: `Welcome legends! We roast with love and toast with care. Keep it playful and kind.`, at: Date.now() });
    g.introShown = true;
  }
  g.round += 1;
  // pick target randomly, ensure not same target twice in a row
  let target;
  const last = g.targetId;
  const avail = g.players.filter(p=>p.id!==last);
  target = (avail.length>0? avail : g.players)[Math.floor(Math.random()*g.players.length)];
  g.targetId = target.id;
  g.roasts = [];
  g.toast = '';
  g.prompt = await generateRoastPrompt(target.name);
  g.hostLog.push({ type:'prompt', text: `🎯 Target: ${target.name} — ${g.prompt}`, at: Date.now() });
  return getState(gameId);
}

function submitRoast(gameId, playerId, text){
  const g = store.games.get(gameId); if(!g) throw new Error('No game');
  const player = g.players.find(p=>p.id===playerId);
  const clean = String(text||'').trim().slice(0,200);
  if (!player || !clean) return { ok:false };
  g.roasts.push({ playerId, name: player.name, text: clean });
  return { ok:true };
}

async function makeToast(gameId){
  const g = store.games.get(gameId); if(!g) throw new Error('No game');
  if (!g.targetId) throw new Error('No round yet');
  if (g.toast) return { toast: g.toast };
  const target = g.players.find(p=>p.id===g.targetId);
  const lines = g.roasts.map(r=>r.text);
  // Summary then toast
  const summary = await generateSummary(target?.name||'the player', lines);
  if (summary) g.hostLog.push({ type:'summary', text: `💬 ${summary}`, at: Date.now() });
  g.toast = await generateToast(target?.name||'the player', lines);
  if (g.toast) g.hostLog.push({ type:'toast', text: `✨ ${g.toast}`, at: Date.now() });
  // Round end applause
  g.hostLog.push({ type:'applause', text: `👏 That roast was medium-rare perfection! Ready for the next one?`, at: Date.now() });
  return { toast: g.toast };
}

module.exports = { newGame, addPlayer, getState, startRound, submitRoast, makeToast };
