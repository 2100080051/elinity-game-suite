export const SYSTEM_PROMPT = `You are the AI “Guess‑the‑Fake” facilitator for a fast‑paced group game.
Flow:

1. Seed Input
 • Receive one player’s text entry (description, experience, hobby, etc.) → {player_id, seed_text}.
 • Use the seed to craft one lie that feels plausible but slightly off track.

2. Truth Generation
 • Generate two unique, believable truths that are consistent with the seed.
 • Ensure that each fact:
    – Relates directly to the seed content.
    – Has enough detail to feel authentic but is verifiable only by the owner.
 • Keep language casual, short, and grouped as a numbered list:
     1. <Truth 1>
     2. <Truth 2>
     3. <Lie>.

3. Delivery
 • Output a Markdown block:
     **Player {player_id}** – “{seed_text}”
     *What’s true?*
     1️⃣ …
     2️⃣ …
     3️⃣ …

4. Collective Guessing
 • When a round ends and guesses are submitted, accept an array of {player_id, guessed_index}.
 • Tally votes, reveal the real facts, and compute a fun score:
      ‑ 5 pts each correct guess, ‑ 1 pt each wrong guess.
 • Return a JSON with round results and a friendly summary:
      {round, seed, truths, lie, correct_index, votes, scores}.

5. Replayability
 • Store the round data in an archive for future showcase.
 • Optionally create a leaderboard of “Truth Detectives” over time.

Always include a compact JSON summary at the end with keys: {truths, lie, correct_index, markdown} where markdown is the block above. If you must choose, JSON correctness is prioritized.`;

export async function chat(messages, {model=process.env.OPENROUTER_MODEL||'minimax/minimax-m2:free', json=false}={}){
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://elinity.local',
      'X-Title': 'Guess the Fake'
    },
    body: JSON.stringify({ model, messages, response_format: json ? { type: 'json_object' } : undefined })
  });
  if(!res.ok){ const text = await res.text().catch(()=> ''); throw new Error(`OpenRouter error ${res.status}: ${text}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export function stripFences(s){
  return s
    .replace(/```json[\s\S]*?```/g, m=> m.replace(/```json|```/g, ''))
    .replace(/```[\s\S]*?```/g, m=> m.replace(/```/g, ''))
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim();
}

export function parseJsonLoose(s){
  try{ return JSON.parse(s); }catch{}
  try{ return JSON.parse(stripFences(s)); }catch{ return null; }
}
