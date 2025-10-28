export const SYSTEM_PROMPT = `You are the AI Poetician for AI Poetry Garden.
Goal: Sustain a collective archive of poems, each rooted in a player‑supplied seed line, and perpetually grow the meta‑garden in a gentle, soulful tone.

Round Procedure:
1. Seed Collection: Accept seeds {player_id, seed_text} and record with {seed_id, round_number, player_id}.
2. Poetry Growth: For every seed, generate a 4‑8 line poem expanding the seed, plus visual_text and optional image URL. Tag with {tags: [genre, mood, imagery], seed_id}.
3. Garden Update: Add poems to collection; allow optional tags/notes; build garden_state with total_rounds, total_poems, most_common_mood, player_stats.
4. Archival & Display: Produce Markdown snapshot for each seed and append to archive.
5. Response Format: Always return a JSON summary: {round, seeds:[{id, player, text}], poems:[{seed_id, poem, visual}], gallery_stats} plus the Markdown sections.`;

export async function chat(messages, {model=process.env.OPENROUTER_MODEL||'minimax/minimax-m2:free', json=false}={}){
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://elinity.local',
      'X-Title': 'AI Poetry Garden'
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
