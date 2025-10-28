function seededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return function() { h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5; return (h >>> 0) / 4294967295; };
}

function createMaze(seed, nodeCount=36) {
  const rnd = seededRandom(seed);
  const nodes = Array.from({length: nodeCount}, (_,i)=>({ id:i, desc: randomDesc(rnd), items: [] }));
  const edges = [];
  // Ensure connectivity with a random spanning tree
  const unvisited = new Set(nodes.map(n=>n.id));
  const stack = [0]; unvisited.delete(0);
  while (unvisited.size) {
    const curr = stack[stack.length-1];
    const all = Array.from(unvisited);
    const next = all[Math.floor(rnd()*all.length)];
    edges.push({ from: curr, to: next, weight: 1 + Math.floor(rnd()*3) });
    stack.push(next); unvisited.delete(next);
  }
  // Add extra edges for 2–3 degree
  const targetEdges = Math.floor(nodeCount * 2.4);
  while (edges.length < targetEdges) {
    const a = Math.floor(rnd()*nodeCount);
    const b = Math.floor(rnd()*nodeCount);
    if (a !== b && !edges.some(e => (e.from===a&&e.to===b)||(e.from===b&&e.to===a))) {
      edges.push({ from: a, to: b, weight: 1 + Math.floor(rnd()*3) });
    }
  }
  // Puzzles
  const colors = ['silver','gold','obsidian','emerald','sapphire'];
  const puzzles = [];
  const exit = nodeCount-1;
  const puzzleCount = 12;
  const takenNodes = new Set([0, exit]);
  for (let i=0;i<puzzleCount;i++) {
    const t = rnd() < 0.5 ? 'key' : (rnd() < 0.8 ? 'switch' : 'mirror');
    let node;
    do { node = Math.floor(rnd()*nodeCount); } while (takenNodes.has(node));
    takenNodes.add(node);
    if (t==='key') puzzles.push({ node, type:'key', key: colors[Math.floor(rnd()*colors.length)] });
    if (t==='switch') puzzles.push({ node, type:'switch', toggles: pickToggle(edges, rnd) });
    if (t==='mirror') puzzles.push({ node, type:'mirror', pair: [Math.floor(rnd()*nodeCount), Math.floor(rnd()*nodeCount)] });
  }
  // Lock some edges by keys
  const locked = [];
  edges.forEach(e => { if (rnd()<0.15) locked.push({ ...e, requires: colors[Math.floor(rnd()*colors.length)] }); });
  return { seed, maze: { nodes, edges, locked, exit }, puzzles };
}

function pickToggle(edges, rnd) {
  const e1 = edges[Math.floor(rnd()*edges.length)];
  let e2 = edges[Math.floor(rnd()*edges.length)];
  let guard=0; while ((e2.from===e1.from && e2.to===e1.to) && guard++<10) { e2 = edges[Math.floor(rnd()*edges.length)]; }
  return [{from:e1.from,to:e1.to},{from:e2.from,to:e2.to}];
}

function randomDesc(rnd) {
  const a = ['Dim','Quiet','Echoing','Misted','Angular','Spiral','Shimmering'];
  const b = ['hall','chamber','alley','archway','node','vault','walk'];
  const c = ['with etched runes','of cold iron','smelling of old paper','lit by floor glyphs','breathing low wind'];
  return `${a[Math.floor(rnd()*a.length)]} ${b[Math.floor(rnd()*b.length)]} ${c[Math.floor(rnd()*c.length)]}.`;
}

module.exports = { createMaze };
