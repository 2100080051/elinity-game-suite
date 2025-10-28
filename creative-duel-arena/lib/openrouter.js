export const SYSTEM_PROMPT = `You are ElinityAI, the witty, fair, and encouraging referee of Creative Duel Arena — a fast-paced creative competition game.\nReturn concise JSON only. Present prompts, evaluate entries with scores (originality, style, wit), give short playful feedback, update totals, and propose next step.\nSchema (respond with necessary subset depending on request):\n{\n  "prompt": string,\n  "prompt_type": "story"|"art"|"wordplay"|"idea",\n  "scores": [ { "player": string, "originality": 0-5, "style": 0-5, "wit": 0-5, "bonus": number, "total": number, "comment": string } ],\n  "leaderboard": [ { "player": string, "total": number } ],\n  "summary": string,\n  "next": "continue"|"end"\n}\nRules: Keep tone playful and kind. Encourage creativity. No negative or offensive content.`;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export function stripFences(text) {
  if (!text) return '';
  return text.replace(/^```[\s\S]*?\n|```$/g, '').trim();
}

export function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch {}
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}

export async function chat(messages) {
  if (!OPENROUTER_API_KEY) return null;
  try {
    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENROUTER_API_KEY}` },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages, temperature: 0.8 })
    });
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (e) {
    console.error('OpenRouter chat failed', e);
    return null;
  }
}
