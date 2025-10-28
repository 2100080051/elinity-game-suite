export async function chat(messages, { model = process.env.OPENROUTER_MODEL, temperature = 0.8 } = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
  if (!model) throw new Error('Missing OPENROUTER_MODEL');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from model');
  return content;
}

export function extractJson(s) {
  if (!s || typeof s !== 'string') throw new Error('Model did not return JSON');
  // Prefer the smallest object containing both "title" and "description" string keys
  const pattern = /{[\s\S]*?"title"\s*:\s*"[^"]+"[\s\S]*?"description"\s*:\s*"[^"]+"[\s\S]*?}/m;
  const match = s.match(pattern);
  if (match) {
    try {
      const cleaned = match[0].replace(/\r?\n/g, ' ');
      return JSON.parse(cleaned);
    } catch {/* fall through */}
  }
  // Fallback: slice from the first { to the last } and try parsing
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i >= 0 && j >= 0 && j > i) {
    return JSON.parse(s.slice(i, j + 1));
  }
  throw new Error('Model did not return JSON');
}
