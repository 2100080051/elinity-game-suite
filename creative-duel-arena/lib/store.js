import { chat, SYSTEM_PROMPT, stripFences, parseJsonLoose } from './openrouter';

const G = globalThis;
if (!G.__ARENA_STORE__) G.__ARENA_STORE__ = { sessions: new Map(), archive: [] };
const store = G.__ARENA_STORE__;

const rid = () => Math.random().toString(36).slice(2, 10);

export function startGame({ players }) {
  const id = Date.now().toString(36) + rid();
  const session = {
    id,
    createdAt: Date.now(),
    round: 0,
    prompt: null,
    prompt_type: null,
    players: (players || []).map((p) => ({ id: rid(), name: p.trim() })).filter(p => p.name),
    entries: {}, // playerId -> text
    leaderboard: {}, // playerName -> total
    judging: [], // last scores
    status: 'lobby'
  };
  session.players.forEach(p => { session.leaderboard[p.name] = 0; });
  store.sessions.set(id, session);
  return session;
}

function localPrompt() {
  const types = ['story','art','wordplay','idea'];
  const t = types[Math.floor(Math.random() * types.length)];
  const prompts = {
    story: 'Write the first line of a sci-fi movie about cats.',
    art: 'Describe a sketch of your mood as a weather pattern.',
    wordplay: 'Invent a new word for happiness.',
    idea: 'Pitch a gadget that only works on Mondays.'
  };
  return { prompt_type: t, prompt: prompts[t] };
}

export async function generatePrompt(id) {
  const s = store.sessions.get(id);
  if (!s) return null;
  s.round += 1;
  s.status = 'prompt';
  s.entries = {};
  s.judging = [];
  let data = null;
  const text = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'Generate a fun open-ended prompt. Return JSON with prompt and prompt_type only.' }
  ]);
  if (text) data = parseJsonLoose(stripFences(text));
  if (!data?.prompt) data = localPrompt();
  s.prompt = data.prompt;
  s.prompt_type = data.prompt_type || 'story';
  return s;
}

export function submitEntry(id, playerId, entry) {
  const s = store.sessions.get(id);
  if (!s) return null;
  s.entries[playerId] = (entry || '').toString().slice(0, 400);
  s.status = 'submission';
  return s;
}

function computeScore(o,s,w) {
  return Math.round(((o*0.4 + s*0.3 + w*0.3) * 5));
}

export async function evaluateRound(id) {
  const s = store.sessions.get(id);
  if (!s) return null;
  s.status = 'judging';
  const entriesArr = s.players.map(p => ({ player: p.name, text: s.entries[p.id] || '' }));
  let judged = null;
  const text = await chat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Prompt: ${s.prompt}. Entries: ${JSON.stringify(entriesArr)}. Evaluate and return scores and short comments in JSON.` }
  ]);
  if (text) judged = parseJsonLoose(stripFences(text));

  if (!judged?.scores) {
    // Local fallback: light random but weighted by entry presence
    judged = { scores: [] };
    for (const p of s.players) {
      const present = (s.entries[p.id] || '').length > 0;
      const O = Math.floor(Math.random()*3 + (present ? 2 : 0));
      const S = Math.floor(Math.random()*3 + (present ? 1 : 0));
      const W = Math.floor(Math.random()*3 + (present ? 1 : 0));
      const bonus = present ? Math.floor(Math.random()*3) : 0;
      judged.scores.push({ player: p.name, originality: O, style: S, wit: W, bonus, total: computeScore(O,S,W)+bonus, comment: present? 'Fun idea!' : 'Missed the window, but we believe in you!' });
    }
  }

  // Update leaderboard
  for (const sc of judged.scores) {
    s.leaderboard[sc.player] = (s.leaderboard[sc.player] || 0) + (sc.total || 0);
  }
  s.judging = judged.scores;
  s.status = 'leaderboard';
  return s;
}

export function getState(id) {
  return store.sessions.get(id) || null;
}

export function endGame(id) {
  const s = store.sessions.get(id);
  if (!s) return null;
  const entries = Object.entries(s.leaderboard).sort((a,b)=>b[1]-a[1]);
  const winner = entries[0]?.[0] || 'Champion';
  const summary = `And that’s a wrap! 👑 ${winner} takes the crown. Thanks for playing!`;
  s.status = 'ended';
  s.summary = summary;
  store.archive.unshift({ id: s.id, createdAt: s.createdAt, rounds: s.round, winner, leaderboard: s.leaderboard });
  store.archive = store.archive.slice(0, 50);
  return s;
}
