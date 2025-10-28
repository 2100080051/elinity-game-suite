const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function chat(messages, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = opts.model || process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3041',
      'X-Title': 'Myth Builder',
    },
    body: JSON.stringify({ model, messages, temperature: 0.85 }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content returned from OpenRouter');
  return content;
}

module.exports = { chat };
