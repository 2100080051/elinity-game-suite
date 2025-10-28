let _store = globalThis.__HIDDEN_Q_STORE__ || { rounds: new Map(), nextId: 1 };
if(!globalThis.__HIDDEN_Q_STORE__) globalThis.__HIDDEN_Q_STORE__ = _store;

export function newId(){ return String(_store.nextId++); }

export function startRound({players, questioner_id, question_id, secret_question, hintThreshold=3}){
  const id = newId();
  const round = {
    id,
    players,
    questioner_id,
    question_id,
    secret_question,
    hintThreshold,
    turn: 1,
    attempts: 0,
    solved: false,
    solver_id: null,
    log: [],
    createdAt: Date.now()
  };
  _store.rounds.set(id, round);
  return round;
}

export function getRound(id){ return _store.rounds.get(String(id)); }
export function saveRound(round){ _store.rounds.set(String(round.id), round); return round; }

export function reset(){ _store.rounds = new Map(); _store.nextId = 1; }
