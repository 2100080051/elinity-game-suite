import { chat, extractJson } from '../../../lib/openrouter';
import { generateImage } from '../../../lib/image';
import { listCards, saveCard } from '../../../lib/store';

const SYSTEM = `You are the AI narrator for Dream Battles.
Return STRICT JSON ONLY with keys "title" and "description". Use double quotes for keys and string values. No code fences, no markdown, no extra text.`;

const REFORMAT_SYSTEM = `You are a JSON formatter. Convert the user's input into STRICT JSON with exactly these keys: "title" (2–3 words) and "description" (1–2 sentences). Use double quotes. Output only the JSON object.`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(listCards());
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { fragment, player = 'Player' } = req.body || {};
    if (!fragment || typeof fragment !== 'string') return res.status(400).json({ error: 'fragment required' });
    // Generate card JSON via OpenRouter
    let content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Fragment: ${fragment}` },
    ]);
    let json;
    try {
      json = extractJson(content);
      if (!json || typeof json !== 'object') throw new Error('Invalid JSON');
    } catch (e) {
      // Retry once with a dedicated formatter system to coerce strict JSON
      try {
        const reformatted = await chat([
          { role: 'system', content: REFORMAT_SYSTEM },
          { role: 'user', content: `Fragment: ${fragment}` },
        ]);
        json = extractJson(reformatted);
      } catch (e2) {
        console.error('JSON parse failed. Original content:', content);
        return res.status(422).json({ error: 'Model did not return valid JSON for title/description. Please tweak the fragment and try again.' });
      }
    }
    const cardBase = {
      title: json.title,
      description: json.description,
      image_url: null,
      fragment,
      player,
      timestamp: Date.now(),
    };
    // Try to generate image (optional, API-only; will throw 501 if unconfigured)
    try {
      const img = await generateImage(`${json.title}. ${json.description}`);
      if (img && typeof img === 'string') cardBase.image_url = img;
      if (img && img.url) cardBase.image_url = img.url;
    } catch (e) {
      // Respect API-only: if image is not configured or fails, proceed without image
      // but do not fabricate or fallback.
    }
    const saved = saveCard(cardBase);
    return res.status(201).json(saved);
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
