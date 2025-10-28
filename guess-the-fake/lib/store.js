let _store = globalThis.__GTF__ || {
  rounds: [],
  archive: [],
  leaderboard: {},
  nextRound: 1,
};
if(!globalThis.__GTF__) globalThis.__GTF__ = _store;

export function newRoundId(){ return _store.nextRound++; }

export function startRound({ player_id, seed_text }){
  const round = {
    id: newRoundId(),
    seed: { player_id, seed_text },
    items: null, // { truths: [t1,t2], lie: "...", correct_index: 1..3 }
    markdown: null,
    votes: [], // [{player_id, guessed_index}]
    result: null // { correct_index, votes, scores, summary }
  };
  _store.rounds.push(round);
  return round;
}

export function saveGenerated(round_id, { truths, lie, correct_index, markdown }){
  const r = _store.rounds.find(x=> x.id===Number(round_id));
  if(!r) return null;
  r.items = { truths, lie, correct_index };
  r.markdown = markdown;
  return r;
}

export function submitVotes(round_id, votes){
  const r = _store.rounds.find(x=> x.id===Number(round_id));
  if(!r) return null;
  r.votes = votes;
  return r;
}

export function revealRound(round_id){
  const r = _store.rounds.find(x=> x.id===Number(round_id));
  if(!r || !r.items) return null;
  const correct = r.items.correct_index;
  const scores = {};
  for(const v of r.votes||[]){
    scores[v.player_id] = (scores[v.player_id]||0) + (v.guessed_index===correct ? 5 : -1);
  }
  // update leaderboard
  for(const pid in scores){ _store.leaderboard[pid] = (_store.leaderboard[pid]||0) + scores[pid]; }
  r.result = { correct_index: correct, votes: r.votes||[], scores };
  _store.archive.push({ id:r.id, seed:r.seed, items:r.items, markdown:r.markdown, result:r.result });
  return r;
}

export function getRound(round_id){ return _store.rounds.find(x=> x.id===Number(round_id)); }
export function getState(){ return { rounds:_store.rounds, archive:_store.archive, leaderboard:_store.leaderboard }; }
