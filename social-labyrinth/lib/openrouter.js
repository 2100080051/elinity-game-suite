require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `System: You are the Elinity Labyrinth Orchestrator (LO), a cooperative puzzle game engine.

World contract:
- Create a connected undirected graph with 30–50 nodes.
- Each node: index id (0..N-1), short evocative desc (<=140 chars).
- Edges: array of { from, to }.
- Locks: some edges are locked by mechanics: key (silver|gold|emerald|sapphire|obsidian), switch (two paired edges, one open at a time), mirror (edge visible only when a mirror shard was aligned at some node).
- Exit: a single node id.

Output formats:
1) init_world (JSON only):
{
  "seed": "string",
  "maze": { "nodes": [{"id":0,"desc":"..."}, ...], "edges": [{"from":0,"to":1}, ...], "locked": [{"from":2,"to":7,"requires":"gold"}, {"from":5,"to":6,"type":"switch","pair": {"from":12,"to":13}}], "exit": <number> },
  "puzzles": [{"type":"key","node":12,"color":"gold"},{"type":"switch","node":8,"toggles":[{"from":5,"to":6},{"from":12,"to":13}]},{"type":"mirror","node":22}]
}

2) player_update (JSON only):
{
  "visible_nodes": [<nodeId>, ...],
  "unlocked_edges": [{"from":A,"to":B}],
  "exit_revealed": <bool>,
  "note": "<= 200 chars guidance, never reveal hidden content"
}

Behavior:
- Never include code fences. Always return strict JSON (no prose) for expectJson.
- When players chat, infer structured updates (e.g., a discovered GOLD KEY unlocks edges requiring gold). Do not invent facts; only derive from provided world.
- Avoid spoilers: do not reveal exact neighbor descriptions or hidden nodes; only acknowledge what becomes visible/unlocked.
- Be concise and game-like in notes.
`;

function stripJsonFences(text){ if(!text) return text; return text.replace(/^```json\n?/i,'').replace(/```\s*$/i,'').trim(); }

async function chat(messages, { expectJson=false, timeoutMs=12000 } = {}){
  if(!OPENROUTER_API_KEY){
    return expectJson ? { text: 'local' } : 'local';
  }
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(new Error('timeout')), timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer':'https://elinity.local',
      'X-Title':'Elinity Social Labyrinth'
    },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages:[{role:'system',content:SYSTEM_PROMPT},...messages], temperature:0.7, response_format: expectJson?{type:'json_object'}:undefined }),
    signal: ctrl.signal
  });
  clearTimeout(t);
  if(!res.ok){ const m = await res.text().catch(()=>res.statusText); throw new Error(`OpenRouter ${res.status}: ${m}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if(expectJson){ const raw = stripJsonFences(content); try { return JSON.parse(raw); } catch { return { text: raw }; } }
  return content;
}

async function generateWorldWithAI(seed, players){
  // Try AI to generate an init_world JSON; fallback to local createMaze if unavailable.
  try{
    const prompt = [
      { role:'user', content: `Create an init_world for a cooperative maze. Use seed: ${seed}. Players currently: ${players||0}.` }
    ];
    const json = await chat(prompt, { expectJson:true, timeoutMs: 15000 });
    // Basic shape validation
    if (json && json.seed && json.maze && Array.isArray(json.maze.nodes) && Array.isArray(json.maze.edges)){
      return json;
    }
    throw new Error('shape invalid');
  }catch(e){
    // Fallback to local
    const { createMaze } = require('./maze');
    const local = createMaze(seed, 36 + Math.floor(Math.random()*8));
    return { seed, ...local };
  }
}

async function interpretClue(world, chatMsg){
  // Ask LO to return a player_update JSON for a single clue.
  try{
    const prompt = [
      { role:'user', content: `World: ${JSON.stringify(world).slice(0,8000)}` },
      { role:'user', content: `Clue: ${String(chatMsg).slice(0,280)}` }
    ];
    const json = await chat(prompt, { expectJson:true, timeoutMs: 10000 });
    if (json && (Array.isArray(json.unlocked_edges) || json.exit_revealed!==undefined || Array.isArray(json.visible_nodes))){
      return json;
    }
    throw new Error('shape invalid');
  }catch(e){
    return null;
  }
}

module.exports = { chat, generateWorldWithAI, interpretClue };
