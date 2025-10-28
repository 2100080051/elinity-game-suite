const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Calls OpenRouter chat completion API with given messages.
 * @param {Array<{role: 'system'|'user'|'assistant', content: string}>} messages
 * @param {object} [opts]
 * @param {string} [opts.model]
 * @returns {Promise<string>} assistant content
 */
async function chat(messages, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = opts.model || process.env.OPENROUTER_MODEL || 'openai/gpt-oss-20b:free';
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY');
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Future Artifact Maker',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.9,
    }),
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
