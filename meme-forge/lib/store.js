// HMR-safe in-memory store for Meme Forge
const GLB = globalThis;
if (!GLB.__MEME_FORGE__) GLB.__MEME_FORGE__ = { rounds: new Map(), seq: 1 };
const DB = GLB.__MEME_FORGE__;

export function newRound(base = {}) {
  const id = String(DB.seq++);
  const round = {
    id,
    prompt: base.prompt || { image_idea: '', seed_phrase: '', thumb: '' },
    captions: [], // { id, text, author? }
    memes: [],    // { id, caption_id, url }
    votes: [],    // { meme_id, delta, voter? }
    winner: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  DB.rounds.set(id, round);
  return round;
}

export function getRound(id) { return DB.rounds.get(String(id)); }
export function saveRound(r) { r.updatedAt = Date.now(); DB.rounds.set(String(r.id), r); return r; }
export function listRounds() { return Array.from(DB.rounds.values()).map(r => ({ id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, winner: r.winner })); }
