const store = globalThis.__mood || { sessions: new Map() };
if(!globalThis.__mood) globalThis.__mood = store;
const { getJourneyPlan } = require('./mood');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

function newSession(){
  const id = uid();
  const session = { id, started:false, finished:false, plan:null, index:0, reflections:[] };
  store.sessions.set(id, session);
  return { sessionId: id };
}

function getState(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  return { id: s.id, started: s.started, finished: s.finished, index: s.index, plan: s.plan, reflections: s.reflections };
}

async function startJourney(sessionId, startMood){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.plan = await getJourneyPlan(startMood||'Calm');
  s.started = true; s.finished = false; s.index = 1; s.reflections = [];
  return getState(sessionId);
}

function nextMood(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  if(!s.started) throw new Error('Not started');
  s.index += 1;
  if(s.index > (s.plan?.phases?.length||0)){ s.finished = true; s.index = s.plan?.phases?.length || 0; }
  return getState(sessionId);
}

function shareResponse(sessionId, text){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  if(!text || !String(text).trim()) return { ok:false };
  s.reflections.push({ i:s.index, text:String(text).trim(), at: Date.now() });
  return { ok:true };
}

function getMap(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const phases = (s.plan?.phases||[]).map((p,i)=> ({ i:i+1, mood:p.mood, color: moodToColor(p.mood) }));
  return { id:s.id, phases, final: s.plan?.final||null, reflections: s.reflections };
}

function moodToColor(m){
  const map = { Calm:'#79b8ff', Curious:'#b889f4', Gratitude:'#ffd38a', Joy:'#ffe27a', Melancholy:'#8aa1b1', Reflection:'#cbb7ff', Serenity:'#98f5e1' };
  return map[m] || '#9aa0a6';
}

module.exports = { newSession, getState, startJourney, nextMood, shareResponse, getMap };
