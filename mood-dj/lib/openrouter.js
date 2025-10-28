export const SYSTEM_PROMPT = `You are the Mood DJ AI – the beat‑and‑see engine for a dynamic, collaborative jam.
Flow:
1. BEGIN ROUNDS:
- Receive a mood payload from each player: {player_id, mood} from {happy, relaxed, energetic, nostalgic, dreamy, edgy, curious, etc.}
- Optionally accept a mood-card ID from a pre-generated pool (if the UI supports cards).
2. GENERATE MATERIALS:
- For every unique mood, produce a 30-second audio segment (JSON with waveform data, or a download URL to a generated MP3) and a 30-second visual sequence (GIF or short video URL referencing color palette, imagery, and motion style). Tag each piece with its mood label and a unique track_id.
3. MINGLE STAGE:
- Enable players to combine any subset of generated tracks/visuals. Accept remix instructions (tempo shift, layering, filter, etc.) represented as a JSON remix spec, and output the final mixed track & composite visual: {mixed_track_url, mixed_visual_url}.
4. SCORING:
- Evaluate the "Party Mood" score with cohesion, energy index, and optional audience rating. Return a playful summary: {"score": 87, "feedback": "Your set radiates a turbo‑cuddle vibe!"}.
5. STATE:
- Maintain {round_id, player_moods[], track_set[], remix_specs[], final_mix[], score}.
All outputs must include a Markdown section and a machine JSON summary: {round_id, player_moods, track_set, final_mix, score}.`;

export async function chat(messages, {model=process.env.OPENROUTER_MODEL||'minimax/minimax-m2:free', json=false}={}){
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://elinity.local',
      'X-Title': 'Mood DJ'
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: json ? { type: 'json_object' } : undefined
    })
  });
  if(!res.ok){
    const text = await res.text().catch(()=> '');
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  return content;
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
  try{ return JSON.parse(stripFences(s)); }catch(e){ return null; }
}
