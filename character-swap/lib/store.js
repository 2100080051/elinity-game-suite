// HMR-safe Character Swap store
const GLB = globalThis;
if (!GLB.__CS__) GLB.__CS__ = { sessions: new Map(), seq: 1 };
const DB = GLB.__CS__;

export function newId(){ return String(DB.seq++); }

export function createSession(base={}){
  const id = newId();
  const s = {
    id,
    players: base.players || ['You','Partner'],
    roster: base.roster || [],
    round: 1,
    swap_pair: base.swap_pair || [],
    scenario_id: base.scenario_id || '',
    prompt_markdown: base.prompt_markdown || '',
    background_markdown: base.background_markdown || '',
    submissions: {}, // { player_id: text }
    scores: [],
    log: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  DB.sessions.set(id, s);
  return s;
}

export function getSession(id){ return DB.sessions.get(String(id)); }
export function saveSession(s){ s.updatedAt=Date.now(); DB.sessions.set(String(s.id), s); return s; }
