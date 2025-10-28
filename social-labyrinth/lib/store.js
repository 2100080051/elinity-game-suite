const { createMaze } = require('./maze');
const { generateWorldWithAI, interpretClue } = require('./openrouter');

const store = globalThis.__labyrinth || { games: new Map() };
if (!globalThis.__labyrinth) globalThis.__labyrinth = store;

function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

function newGame() {
  const seed = `${Date.now()}-${Math.floor(Math.random()*1e6)}`;
  // Attempt AI-first world; if fails, fallback to local createMaze
  let base;
  try {
    const world = globalThis.__use_ai_world__ === false ? null : null; // placeholder to avoid bundler changes
    // generateWorldWithAI is async; but API handler is sync-friendly. We'll generate lazily on first access.
  } catch {}
  base = createMaze(seed, 36 + Math.floor(Math.random()*8));
  const id = uid();
  const game = {
    id, seed,
    base, // {maze:{nodes,edges,locked,exit}, puzzles:[]}
    createdAt: Date.now(),
    players: new Map(), // id -> { id, name, node, seen:Set, journal:[], lastSeq:0 }
    chat: [], // { playerId, msg, at }
    solved: { keys: new Set(), toggles: new Set(), mirrors: new Set() },
    unlocked: new Set(), // edge key string "a-b"
    exitRevealed: false,
    seq: 0, // incremental update id
  };
  // initial unlocked = edges without lock
  base.maze.edges.forEach(e => {
    const key = edgeKey(e.from, e.to);
    if (!base.maze.locked.some(l => (l.from===e.from && l.to===e.to) || (l.from===e.to && l.to===e.from))) {
      game.unlocked.add(key);
    }
  });
  store.games.set(id, game);
  // Fire-and-forget: try to upgrade base with AI world after creation
  ;(async ()=>{
    try{
      const ai = await generateWorldWithAI(seed, 0);
      if (!ai || !ai.maze || !Array.isArray(ai.maze.nodes)) return;
      // Convert AI shape into local base shape if using fallback format
      const converted = ai.maze.locked ? { maze: { nodes: ai.maze.nodes, edges: ai.maze.edges, locked: ai.maze.locked||[], exit: ai.maze.exit }, puzzles: ai.puzzles||[] } : ai;
      game.base = converted;
      // Recompute unlocked edges after swap
      game.unlocked = new Set();
      converted.maze.edges.forEach(e => {
        const key = edgeKey(e.from, e.to);
        if (!converted.maze.locked?.some(l => (l.from===e.from && l.to===e.to) || (l.from===e.to && l.to===e.from))) {
          game.unlocked.add(key);
        }
      });
      game.seq++;
    }catch{}
  })();
  return { id, seed, players: 0 };
}

function listGames() {
  return Array.from(store.games.values()).map(g => ({ id: g.id, seed: g.seed, players: g.players.size, createdAt: g.createdAt }));
}

function joinGame(gameId, name) {
  const g = store.games.get(gameId);
  if (!g) throw new Error('No such game');
  const pid = uid();
  // assign a unique starting node
  const used = new Set(Array.from(g.players.values()).map(p=>p.node));
  let node = 0; let guard=0;
  while (used.has(node) && guard++<100) node = Math.floor(Math.random()*g.base.maze.nodes.length);
  const player = { id: pid, name: name || `Player ${pid.slice(0,4)}`, node, seen: new Set([node]), journal: [], lastSeq: 0 };
  g.players.set(pid, player);
  g.seq++;
  return { gameId, playerId: pid };
}

function edgeKey(a,b){ return a<b ? `${a}-${b}` : `${b}-${a}`; }

function neighborsOf(g, node){
  const nb = g.base.maze.edges.filter(e => e.from===node || e.to===node).map(e => e.from===node ? e.to : e.from);
  return nb.slice(0,3); // limit to 3 neighbors
}

function getState(gameId, playerId){
  const g = store.games.get(gameId); if (!g) throw new Error('No game');
  const p = g.players.get(playerId); if (!p) throw new Error('No player');
  const nb = neighborsOf(g, p.node);
  const labels = ['A','B','C'];
  const neighborMap = nb.map((n,i)=>({ label: labels[i], id: n, unlocked: g.unlocked.has(edgeKey(p.node,n)) }));
  const node = g.base.maze.nodes[p.node];
  const puzzlesHere = g.base.puzzles.filter(z => z.node===p.node).map(z => ({ type: z.type, hint: hintFor(z) }));
  const journal = Array.from(g.chat.slice(-20));
  return {
    id: g.id,
    seed: g.seed,
    exitRevealed: g.exitRevealed,
    current: { id: p.node, description: node.desc, puzzles: puzzlesHere },
    neighbors: neighborMap,
    stats: { player: p.id, nodesSeen: p.seen.size },
    journal,
  };
}

function hintFor(z){
  if (z.type==='key') return `Something metallic glints here.`;
  if (z.type==='switch') return `A lever waits, unsure which way it prefers.`;
  if (z.type==='mirror') return `A polished shard leans at an angle.`;
  return '';
}

function applyClue(g, p, msg){
  // parse keys
  const keyMatch = msg.match(/(silver|gold|obsidian|emerald|sapphire)\s+key/i);
  if (keyMatch) {
    g.solved.keys.add(keyMatch[1].toLowerCase());
  }
  // parse switch
  if (/switch|lever/i.test(msg)) {
    // unlock one random toggle pair
    const sw = g.base.puzzles.find(z=>z.type==='switch');
    if (sw && sw.toggles) {
      const one = Math.random()<0.5 ? sw.toggles[0] : sw.toggles[1];
      g.unlocked.add(edgeKey(one.from, one.to));
      g.solved.toggles.add(`${one.from}-${one.to}`);
    }
  }
  // parse mirror
  if (/mirror/i.test(msg)) {
    g.solved.mirrors.add(p.node);
  }
  // unlock edges requiring keys
  g.base.maze.locked.forEach(l => {
    if (g.solved.keys.has(l.requires)) g.unlocked.add(edgeKey(l.from,l.to));
  });
}

function chat(gameId, playerId, message){
  const g = store.games.get(gameId); if (!g) throw new Error('No game');
  const p = g.players.get(playerId); if (!p) throw new Error('No player');
  const msg = String(message||'').slice(0,280);
  g.chat.push({ playerId, msg, at: Date.now() });
  applyClue(g, p, msg);
  // Try AI orchestrator to refine updates (non-blocking)
  ;(async ()=>{
    const world = { seed: g.seed, maze: g.base.maze, puzzles: g.base.puzzles };
    const upd = await interpretClue(world, msg);
    if (upd){
      // Apply unlocked_edges
      if (Array.isArray(upd.unlocked_edges)){
        upd.unlocked_edges.forEach(e=>{ if(e && typeof e.from==='number' && typeof e.to==='number'){ g.unlocked.add(edgeKey(e.from,e.to)); }});
      }
      if (typeof upd.exit_revealed === 'boolean' && upd.exit_revealed){ g.exitRevealed = true; }
      g.seq++;
    }
  })();
  g.seq++;
  // victory check
  if (p.node === g.base.maze.exit && !g.exitRevealed){
    g.exitRevealed = true;
  }
  return { ok: true };
}

function move(gameId, playerId, label){
  const g = store.games.get(gameId); if (!g) throw new Error('No game');
  const p = g.players.get(playerId); if (!p) throw new Error('No player');
  const labels = ['A','B','C'];
  const nb = neighborsOf(g, p.node);
  const idx = labels.indexOf(String(label||'').toUpperCase());
  if (idx<0 || idx>=nb.length) return { ok:false, error:'Invalid neighbor' };
  const target = nb[idx];
  if (!g.unlocked.has(edgeKey(p.node, target))) return { ok:false, error:'Path locked' };
  p.node = target; p.seen.add(target);
  g.seq++;
  if (p.node === g.base.maze.exit) g.exitRevealed = true;
  return { ok:true };
}

module.exports = { newGame, listGames, joinGame, getState, chat, move };
