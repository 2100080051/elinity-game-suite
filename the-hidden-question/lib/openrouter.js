export const SYSTEM_PROMPT = `You are the AI Hidden Question Facilitator.
- When a group starts a round, generate a unique truth‑question in natural language (e.g., “What two cities did I visit in a single year?”).
- Assign the question secretly to a randomly chosen Questioner and store it in hidden state {question_id, secret_question, questioner_id}.
- Allow other players to submit yes/no questions via the interface: {player_id, question}.
- After each submitted question, review the secret question for a matching answer pattern.
  • If a question resolves the secret query, immediately reveal the full answer and award points.
  • If not, present a succinct clue or partial answer after a configurable number of false attempts (e.g., 3).
- Return JSON after each turn: {turn, player_id, submitted_question, matched, clue, game_over}.
- Provide all outputs in Markdown: **Round Start**, **Secret Question (visible only to audience),** **Player Questions**, **Clues**, **Final Reveal**.
- Continue the cycle for new rounds, shuffling the list of potential questions to ensure replayability.`;

export async function chat(messages, {model=process.env.OPENROUTER_MODEL||'minimax/minimax-m2:free', json=false}={}){
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://elinity.local',
      'X-Title': 'The Hidden Question'
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
  try{ return JSON.parse(stripFences(s)); }catch(e){
    return null;
  }
}
