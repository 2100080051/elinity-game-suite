export async function chat(messages, { model = process.env.OPENROUTER_MODEL, temperature = 0.7 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
  if (!model) throw new Error('Missing OPENROUTER_MODEL');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature }),
  });
  if (!res.ok) { const text = await res.text(); throw new Error(`OpenRouter error: ${res.status} ${text}`); }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from model');
  return content;
}

export function extractJson(s) {
  if (!s || typeof s !== 'string') throw new Error('Model did not return JSON');
  const statePattern = /{[\s\S]*?"session_id"[\s\S]*?"acts"[\s\S]*?"characters"[\s\S]*?"locations"[\s\S]*?"items"[\s\S]*?"morale"[\s\S]*?"metaphoric_theme"[\s\S]*?}/m;
  const match = s.match(statePattern);
  if (match) {
    try { return JSON.parse(match[0].replace(/\r?\n/g, ' ')); } catch {}
  }
  const i = s.indexOf('{'); const j = s.lastIndexOf('}');
  if (i>=0 && j>i) return JSON.parse(s.slice(i,j+1).replace(/\r?\n/g,' '));
  throw new Error('Model did not return JSON');
}
