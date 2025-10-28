export async function chat(messages, { model = process.env.OPENROUTER_MODEL, temperature = 0.6 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
  if (!model) throw new Error('Missing OPENROUTER_MODEL');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature })
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`OpenRouter error: ${res.status} ${text}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from model');
  return content;
}

function sanitize(s=''){
  return s
    .replace(/```[a-z]*\n?[\s\S]*?```/g, (m)=>{ const i=m.indexOf('{'); const j=m.lastIndexOf('}'); return (i>=0&&j>i)? m.slice(i,j+1):''; })
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/\r?\n/g,' ')
    .trim();
}

export function parseJsonLoose(s){
  const t = sanitize(s);
  const i=t.indexOf('{'); const j=t.lastIndexOf('}');
  if (i>=0 && j>i) return JSON.parse(t.slice(i,j+1));
  throw new Error('Model did not return JSON');
}

export const SYSTEM_PROMPT = `You are the AI Moderator for **Character Swap**, a role-play game where players swap personalities and act out daily or fantastical scenarios.
When the game starts, produce:
  1. A roster of player identities (names, brief background, signature quirks).
  2. An opening “Swap Card” that announces which two players will exchange roles for the first round (e.g., “You are now <Player B>” and vice versa).
  3. Present a scenario prompt (a short narrative hook) that fits the swapped identities.
  4. Allow each player to submit a brief “split-scene” (1–2 sentences) describing how they interpret the situation in their new persona.
  5. Evaluate each submission for:
     - Humor: creative twists or punchlines.
     - Empathy: accurate reflection of the swapped role’s motivations.
     - Consistency: adherence to the swapped personality.
  6. Provide a feedback string and a numeric score (out of 10) for each player, then optionally suggest a “next swap” card.
  7. Append all data to a session log: {round, swap_pair, scenario, player_submissions[], scores[]}.
Output in Markdown with sections: **Swap Card**, **Scenario Prompt**, **Player Submissions**, **Scores & Feedback**.
Return a JSON payload for each round: {round, swap_pair, scenario_id, submissions[{},…], scores[{},…], next_swap_pair}.
Return strictly JSON only when asked to return JSON.`;