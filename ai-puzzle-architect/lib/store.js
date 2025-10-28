// HMR-safe puzzle/session store
const GLB = globalThis;
if (!GLB.__PA__) GLB.__PA__ = { sessions: new Map(), puzzles: new Map(), seq: 1 };
const DB = GLB.__PA__;

export function newId(){ return String(DB.seq++); }

export function createSession(base={}){
  const id = newId();
  const s = {
    id,
    mode: base.mode || 'solo', // solo | group
    players: base.players || [], // [{player_id, score}]
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  DB.sessions.set(id, s);
  return s;
}

export function getSession(id){ return DB.sessions.get(String(id)); }
export function saveSession(s){ s.updatedAt=Date.now(); DB.sessions.set(String(s.id), s); return s; }

export function createPuzzle(base){
  const id = base?.id ? String(base.id) : newId();
  const p = {
    id,
    session_id: base.session_id || null,
    type: base.type,
    difficulty: base.difficulty,
    prompt_markdown: base.prompt_markdown || '',
    supporting_data: base.supporting_data || {},
    solution_spec: base.solution_spec || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  DB.puzzles.set(id, p);
  return p;
}

export function getPuzzle(id){ return DB.puzzles.get(String(id)); }
export function savePuzzle(p){ p.updatedAt=Date.now(); DB.puzzles.set(String(p.id), p); return p; }
