// In-memory store for rooms and sessions (persist across dev HMR via globalThis)
const GLB = globalThis;
if (!GLB.__ESCAPE_ROOMS__) {
  GLB.__ESCAPE_ROOMS__ = { rooms: new Map(), seq: 1 };
}
const rooms = GLB.__ESCAPE_ROOMS__.rooms; // id -> state
function nextId() { const id = GLB.__ESCAPE_ROOMS__.seq; GLB.__ESCAPE_ROOMS__.seq = id + 1; return id; }

export function createRoom({ players = [], durationSec = 600, scenario = '', ambient = null }) {
  const id = String(nextId());
  const now = Date.now();
  const state = {
    id,
    players,
    createdAt: now,
    startAt: now,
    durationSec,
    scenario,
    ambient,
    points: 0,
    clues: [], // {text, time}
    hints: [], // {text, time}
    puzzles: [], // [{prompt, difficulty}]
    currentIndex: 0,
  };
  rooms.set(id, state);
  return state;
}

export function getRoom(id) { return rooms.get(String(id)); }
export function saveRoom(state) { rooms.set(String(state.id), state); return state; }
export function listRooms() { return Array.from(rooms.values()); }

export function timeLeft(state) {
  const elapsed = Math.floor((Date.now() - state.startAt) / 1000);
  return Math.max(0, state.durationSec - elapsed);
}
