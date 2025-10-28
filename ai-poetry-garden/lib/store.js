let _store = globalThis.__POETRY_GARDEN__ || { garden: { rounds: [], archive: [], stats: { total_rounds: 0, total_poems: 0, most_common_mood: null, player_stats: {} } }, nextSeed: 1, nextRound: 1 };
if(!globalThis.__POETRY_GARDEN__) globalThis.__POETRY_GARDEN__ = _store;

export function newSeedId(){ return String(_store.nextSeed++); }
export function newRoundNumber(){ return _store.nextRound++; }

export function startRound({ seeds }){
  const round_number = newRoundNumber();
  const round = { round_number, seeds: seeds.map(s=> ({ ...s, seed_id: newSeedId() })), poems: [] };
  _store.garden.rounds.push(round);
  _store.garden.stats.total_rounds = _store.garden.rounds.length;
  return round;
}

export function savePoems(round_number, poems){
  const round = _store.garden.rounds.find(r=> r.round_number===round_number);
  if(!round) return null;
  round.poems = poems;
  _store.garden.archive.push({ round_number, poems });
  _store.garden.stats.total_poems = _store.garden.rounds.reduce((a,r)=> a + (r.poems?.length||0), 0);
  return round;
}

export function getRound(round_number){
  return _store.garden.rounds.find(r=> r.round_number===Number(round_number));
}

export function getGarden(){ return _store.garden; }
