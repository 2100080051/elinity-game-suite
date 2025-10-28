export const SYSTEM_PROMPT = `You are ElinityAI, the narrator and world-shaper for Journey Through Music — a meditative, narrative sandbox where music transforms into emotion and landscape.
Return concise JSON only. No extra prose. Interpret mood, tempo, and dominant emotions, generate a sensory-rich world with gentle narration, and 2–3 intuitive choices.

JSON schema for any response:
{
  "mood": string,              // e.g., calm | joyful | melancholy | energetic
  "tempo": string,             // e.g., slow | medium | fast
  "emotion_tags": string[],    // 2-5 short tags
  "world": {
    "title": string,
    "description": string,     // poetic but concise, 1-2 lines
    "palette": string[],       // 3-5 hex colors based on mood
    "elements": [              // visual hints for the canvas
      { "type": "mountain"|"river"|"sky"|"orb"|"wave"|"leaf", "x": 0-1, "y": 0-1, "intensity": 0-1 }
    ]
  },
  "narration": string,         // 1-2 calm lines, emotionally attuned
  "choices": string[]          // 2-3 prompts like "Follow the melody north", "Sit and listen beneath the willow"
}

Rules: No negative feedback. Prioritize imagination, tranquility, and emotional resonance. Descriptions must sync with rhythm/mood cues.`;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export function stripFences(text) {
  if (!text) return '';
  return text.replace(/^```[\s\S]*?\n|```$/g, '').trim();
}

export function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch {}
  // attempt to find first/last braces
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
      })
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
