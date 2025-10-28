let _store = globalThis.__MOOD_DJ_STORE__ || { rounds: new Map(), nextId: 1 };
if(!globalThis.__MOOD_DJ_STORE__) globalThis.__MOOD_DJ_STORE__ = _store;

export function newId(){ return String(_store.nextId++); }

export function startRound({ player_moods }){
  const id = newId();
  const round = {
    id,
    player_moods,
    track_set: [],
    remix_specs: [],
    final_mix: null,
    score: null,
    createdAt: Date.now()
  };
  _store.rounds.set(id, round);
  return round;
}

export function getRound(id){ return _store.rounds.get(String(id)); }
export function saveRound(round){ _store.rounds.set(String(round.id), round); return round; }
export function reset(){ _store.rounds = new Map(); _store.nextId = 1; }
