// HMR-safe in-memory session store
const GLB = globalThis;
if (!GLB.__TLJ__) GLB.__TLJ__ = { sessions: new Map(), seq: 1 };
const SESS = GLB.__TLJ__;

export function createSession(base = {}) {
  const id = String(SESS.seq++);
  const now = Date.now();
  const s = {
    id,
    createdAt: now,
    updatedAt: now,
    state: base.state || { session_id: id, acts: [], characters: [], locations: [], items: [], morale: 0, metaphoric_theme: '' },
    chapters: base.chapters || [], // each: {title, summary}
    lastMarkdown: base.lastMarkdown || '',
  };
  SESS.sessions.set(id, s);
  return s;
}

export function getSession(id) { return SESS.sessions.get(String(id)); }
export function saveSession(s) { s.updatedAt = Date.now(); SESS.sessions.set(String(s.id), s); return s; }
export function listSessions() { return Array.from(SESS.sessions.values()); }
