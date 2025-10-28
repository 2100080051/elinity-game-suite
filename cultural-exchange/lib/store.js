// HMR-safe session store
const GLB = globalThis;
if (!GLB.__CX__) GLB.__CX__ = { sessions: new Map(), seq: 1 };
const DB = GLB.__CX__;

export function createSession(base={}){
  const id = String(DB.seq++);
  const s = {
    id,
    culture: base.culture || '',
    scene: base.scene || '',
    roles: base.roles || ['Village elder','Curious traveler','Newcomer','Artisan','Storykeeper'],
    participants: base.participants || [], // {player_id, role}
    actions: base.actions || [], // {turn_number, player_id, action_text, ai_response_text}
    facts: base.facts || [],
    turn_number: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  DB.sessions.set(id, s);
  return s;
}

export function getSession(id){ return DB.sessions.get(String(id)); }
export function saveSession(s){ s.updatedAt=Date.now(); DB.sessions.set(String(s.id), s); return s; }

export function claimRole(s, player_id, role){
  const taken = s.participants.find(p=>p.role===role);
  if (!taken) s.participants.push({ player_id, role });
  saveSession(s);
  return s;
}
