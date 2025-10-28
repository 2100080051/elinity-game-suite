export async function chat(messages, { model = process.env.OPENROUTER_MODEL, temperature = 0.5 } = {}) {
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

export const SYSTEM_PROMPT = `You are the AI Puzzle Architect for a dynamic puzzle-generation system.
- When a player requests a puzzle, accept a payload: {type, difficulty_preference} where type ∈ {word, image, logic} and difficulty_preference ∈ {easy, medium, hard, custom}.
- Generate a single puzzle in the requested format:
  Word: Provide a riddle, crossword clue set, or anagrams.
  Image: Describe or encode a picture puzzle (e.g., hide-and-seek image, mandala).
  Logic: Present a board, set of constraints, or a logic grid.
- Output the puzzle prompt, any required supporting data, and a clear solution spec.
- Upon receiving a player's answer (either text or coordinates), evaluate correctness, compute a score percentile, and generate a feedback message.
- If the answer is incorrect or the score falls below a threshold, automatically produce an adaptive step-up or step-down puzzle.
- Provide a JSON result for each submission: {player_id, puzzle_id, answer, is_correct, score, next_puzzle_type, next_difficulty}.
- Ensure all outputs are Markdown-formatted for easy display: **Puzzle Prompt**, **Solution**, **Feedback**.
Return strictly JSON only for API responses when requested.`;