// HMR-safe board game state
const GLB = globalThis;
if (!GLB.__LGBG__) GLB.__LGBG__ = { game: null };
const ST = GLB.__LGBG__;

function emptyBoard(size){
  const total = size*size;
  return Array.from({length: total}, (_,i)=>({ index: i+1, title: '' }));
}

export function newGame({ size=5, players=['Player A','Player B'] }={}){
  const board = emptyBoard(size);
  const game = {
    size,
    board, // [{index,title}]
    players,
    current_player: 0,
    current_space: 1,
    moves: [], // {player, from, to, roll}
    goals: {}, // { index: title }
    journeys: [], // {player, space, description, journey_text, journey_image_url}
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  ST.game = game;
  return game;
}

export function getGame(){ return ST.game; }
export function save(){ if (ST.game) ST.game.updatedAt = Date.now(); return ST.game; }

export function nameGoal(index, title){
  const g = getGame(); if (!g) return;
  g.goals[index] = title||'';
  const cell = g.board.find(c=>c.index===index); if (cell) cell.title = title||'';
  save();
  return g;
}

export function rollDie(){ return 1 + Math.floor(Math.random()*6); }

export function applyRoll(roll){
  const g = getGame(); if (!g) return;
  const from = g.current_space;
  const total = g.size * g.size;
  let to = from + roll; while (to>total) to -= total;
  g.current_space = to;
  const player = g.players[g.current_player];
  g.moves.push({ player, from, to, roll });
  save();
  return { player, from, to, roll };
}

export function endTurn(){
  const g = getGame(); if (!g) return;
  g.current_player = (g.current_player + 1) % g.players.length;
  save();
  return g.players[g.current_player];
}
