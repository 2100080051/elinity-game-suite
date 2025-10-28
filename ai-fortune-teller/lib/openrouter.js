require('./env');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

const SYSTEM_PROMPT = `You are Elinity AI, a kind and whimsical oracle.
- Speak in short, luminous lines (1-3 sentences).
- Offer uplifting fortunes that are safe for all ages.
- Keep it poetic but clear; avoid doom or absolutes.
- Never give medical, legal, or financial advice; gently reframe to encouragement.
`;

function stripJsonFences(text) {
  if (!text) return text;
  return text
    .replace(/^```json\n?/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function chat(messages, { expectJson = false } = {}) {
  // Local fallback when no API key is available
  if (!OPENROUTER_API_KEY) {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const content = lastUser?.content || 'Offer a brief blessing.';
    const fallback = `A gentle sign shimmers:\n${content.slice(0, 60)}…\nTrust the quiet glow and take one kind step.`;
    if (expectJson) {
      return { text: fallback };
    }
    return fallback;
  }

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://elinity.local',
      'X-Title': 'Elinity Fortune Teller'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.8,
      response_format: expectJson ? { type: 'json_object' } : undefined
    })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${msg}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (expectJson) {
    const raw = stripJsonFences(content);
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { text: raw };
    }
  }
  return content;
}

function buildFortunePrompt({ mood, situation, intention }) {
  const lines = [
    'Create a short, poetic fortune (1-3 lines).',
    'Tone: kind, mystical, uplifting. Be specific but gentle.',
    'Avoid promises, avoid fear, avoid sensitive advice.',
  ];
  const details = [
    mood ? `Mood: ${mood}` : null,
    situation ? `Situation: ${situation}` : null,
    intention ? `Intention: ${intention}` : null,
  ].filter(Boolean).join('\n');
  return `${lines.join('\n')}\n${details}`.trim();
}

module.exports = {
  chat,
  buildFortunePrompt,
};
