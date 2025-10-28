require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are the Oracle for a reflective AI game called "Symbol Quest".

Your role:
- Act as a mystical storyteller and guide through a symbolic world.
- Describe each scene with rich sensory language and deep metaphor.
- Offer 2–3 possible symbolic choices for the player.
- When the player chooses, respond with a short, poetic interpretation of what happens — connecting their action to an emotional or philosophical meaning.
- Keep tone: calm, spiritual, imaginative, and slightly mysterious.
- Each round deepens the metaphorical journey — leading to an ultimate reflection or realization.
- End after 4–6 scenes with a closing insight or symbolic gift.

Game Rules:
1. Begin by introducing the world — the realm of symbols and self-discovery.
2. Present a symbolic setting and 2–3 evocative actions to choose from.
3. Wait for the player’s choice.
4. Respond with a poetic, insightful consequence.
5. Occasionally summarize the path taken so far.
6. Conclude with a short, beautiful insight.
7. Keep outcomes positive, meaningful, and metaphor-rich.
`;

function stripJsonFences(text) {
  if (!text) return text;
  return text.replace(/^```json\n?/i, '').replace(/```\s*$/i, '').trim();
}

function withTimeout(ms, signal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error('timeout')), ms);
  const out = signal ? { signal: ctrl.signal } : { signal: ctrl.signal };
  return { controller: ctrl, timer, fetchInit: out };
}

async function chat(messages, { expectJson = false, timeoutMs = 12000 } = {}) {
  if (!OPENROUTER_API_KEY) {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const content = lastUser?.content || '';
    const fallback = expectJson
      ? { scene: 'You arrive at the Whispering Bridge of Doubt. Mist curls around your ankles.', choices: ['Step forward', 'Wait and listen', 'Speak your name'] }
      : 'You arrive at the Whispering Bridge of Doubt. Mist curls around your ankles. Choices: Step forward · Wait and listen · Speak your name.';
    return fallback;
  }
  const { controller, timer, fetchInit } = withTimeout(timeoutMs);
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://elinity.local',
      'X-Title': 'Elinity Symbol Quest'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [ { role: 'system', content: SYSTEM_PROMPT }, ...messages ],
      temperature: 0.8,
      response_format: expectJson ? { type: 'json_object' } : undefined
    }),
    ...fetchInit
  });
  clearTimeout(timer);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${msg}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (expectJson) {
    const raw = stripJsonFences(content);
    try { return JSON.parse(raw); } catch { return { text: raw }; }
  }
  return content;
}

function localScene() {
  const templates = [
    { s: 'You reach the Mirror Lake of Truth. The surface holds your name like a secret.', c: ['Gaze into the water', 'Throw a pebble', 'Walk the shoreline'] },
    { s: 'At the Whispering Bridge of Doubt, wind braids questions into the rope.', c: ['Step forward', 'Wait and listen', 'Whisper your fear'] },
    { s: 'The Lantern Path forks under silver leaves, each rustle a memory.', c: ['Follow the soft glow', 'Sit and breathe', 'Ask the dark for a sign'] },
    { s: 'Before the Archive of Echoes, doors murmur your earlier footsteps.', c: ['Open the quietest door', 'Knock three times', 'Leave a note behind'] },
    { s: 'In the Garden of Stillness, dew beads hold tiny dawns.', c: ['Touch a leaf', 'Close your eyes', 'Walk barefoot on the moss'] }
  ];
  const pick = templates[Math.floor(Math.random()*templates.length)];
  return { scene: pick.s, choices: pick.c };
}

async function generateScene({ pathSummary }) {
  const prompt = `Create a symbolic scene with 2-3 choices as JSON. Be concise, poetic.\nPath so far: ${pathSummary || '—'}\nRespond strictly as: { scene: string, choices: string[] }`;
  try {
    const data = await chat([{ role: 'user', content: prompt }], { expectJson: true, timeoutMs: 12000 });
    if (data?.scene && Array.isArray(data.choices) && data.choices.length >= 2) return data;
  } catch {}
  return localScene();
}

function localOutcome(scene, choice) {
  const lines = [
    `You choose: ${choice}. The air brightens, as if remembering a promise.`,
    `A small courage stirs; the path loosens, showing one more stone.`,
    `Somewhere, a quiet bell says yes.`
  ];
  return lines.join('\n');
}

async function interpretChoice({ scene, choice, pathSummary }) {
  const prompt = `Scene: ${scene}\nChoice: ${choice}\nPath: ${pathSummary || '—'}\nIn 2-3 short lines, reveal a poetic, positive consequence. Then suggest the next symbolic direction in one short line.`;
  try {
    const text = await chat([{ role: 'user', content: prompt }], { timeoutMs: 12000 });
    return String(text || '').trim();
  } catch {
    return localOutcome(scene, choice);
  }
}

module.exports = { chat, generateScene, interpretChoice };
