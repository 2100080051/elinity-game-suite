const store = globalThis.__puzzle || { sessions: new Map() };
if(!globalThis.__puzzle) globalThis.__puzzle = store;
const { getChapterIntro, getPuzzle, verifyAnswer } = require('./master');

function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

function newSession(){
  const id = uid();
  const session = { id, player_name: '', current_chapter: 1, current_index: 0, puzzles: [], intro: null, narrator: '', progress:{ puzzles_solved:0, hints_used:0, difficulty_level:'Medium' }, story_flags:[], next_chapter:'', updatedAt: Date.now() };
  store.sessions.set(id, session); return { sessionId: id };
}

function getState(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const current = s.puzzles[s.current_index-1] || null;
  const total = s.puzzles.length || 3;
  return { id:s.id, chapter:s.current_chapter, title:s.intro?.title||'', narration:s.intro?.narration||'', setting:s.intro?.setting||'', index:s.current_index, total, current, progress:s.progress, story_flags:s.story_flags, next_chapter:s.next_chapter, updatedAt:s.updatedAt };
}

async function startChapter(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  s.intro = await getChapterIntro(s.current_chapter);
  s.puzzles = []; s.current_index = 0; s.updatedAt = Date.now();
  // Preload 3 puzzles for determinism
  for(let i=1;i<=3;i++){ s.puzzles.push(await getPuzzle(s.current_chapter, i)); }
  return getState(sessionId);
}

function showHint(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const p = s.puzzles[s.current_index-1]; if(!p) throw new Error('No active puzzle');
  const used = p.usedHints||0; const hint = (p.hints||[])[used] || null;
  if(hint){ p.usedHints = used+1; s.progress.hints_used += 1; s.updatedAt = Date.now(); }
  return { hint };
}

async function ensureActivePuzzle(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  if(s.current_index<1){ s.current_index = 1; if(!s.puzzles[0]) s.puzzles[0] = await getPuzzle(s.current_chapter, 1); }
  return s.puzzles[s.current_index-1];
}

async function submitAnswer(sessionId, answer){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const p = await ensureActivePuzzle(sessionId);
  const result = await verifyAnswer(s.current_chapter, s.current_index, answer);
  if(result.correct){ s.progress.puzzles_solved += 1; s.current_index += 1; if(s.current_index>3){ s.next_chapter = s.current_chapter+1; } }
  s.updatedAt = Date.now();
  return { result, state: getState(sessionId) };
}

async function skipPuzzle(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  await ensureActivePuzzle(sessionId);
  s.current_index += 1; if(s.current_index>3){ s.next_chapter = s.current_chapter+1; }
  s.updatedAt = Date.now();
  return getState(sessionId);
}

function saveProgress(sessionId){
  const s = store.sessions.get(sessionId); if(!s) throw new Error('No session');
  const save = { player_name:s.player_name, current_chapter:s.current_chapter, progress:s.progress, story_flags:s.story_flags, next_chapter:s.next_chapter };
  return { ok:true, save };
}

module.exports = { newSession, getState, startChapter, showHint, submitAnswer, skipPuzzle, saveProgress };
