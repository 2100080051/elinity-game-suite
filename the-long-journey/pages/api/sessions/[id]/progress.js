import { chat } from '../../../../lib/openrouter';
import { getSession, saveSession } from '../../../../lib/store';

function parseOutermostJson(s) {
  if (!s || typeof s !== 'string') throw new Error('No content');
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i >= 0 && j > i) {
    const candidate = s.slice(i, j + 1).replace(/\r?\n/g, ' ');
    return JSON.parse(candidate);
  }
  throw new Error('No JSON found');
}

function validateStateShape(state) {
  const keys = ['session_id','acts','characters','locations','items','morale','metaphoric_theme'];
  for (const k of keys) if (!(k in state)) throw new Error(`state missing ${k}`);
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { id } = req.query;
    const s = getSession(id);
    if (!s) return res.status(404).json({ error: 'Session not found' });

    const { action = '' } = (req.body || {});
    if (!action || typeof action !== 'string') return res.status(400).json({ error: 'Missing action' });

    const sys = `You are Elinity AI, the epic guide for "The Long Journey". Return ONLY strict JSON, no markdown fences.
Schema:
{
  "narration_markdown": string (<= 180 words),
  "state": {"session_id": string, "acts": [], "characters": [], "locations": [], "items": [], "morale": number, "metaphoric_theme": string},
  "chapter_complete": boolean,
  "chapter_title": string (present only if chapter_complete true, <= 8 words),
  "summary": string (present only if chapter_complete true, <= 80 words)
}`;

    const user = `Continue the current chapter based on the player's action.
Action: ${action}
Current state JSON: ${JSON.stringify(s.state)}
Recent context: ${s.lastMarkdown}
Keep continuity. Keep narration vivid yet concise.`;

    let content = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ]);

    let payload;
    try {
      payload = parseOutermostJson(content);
    } catch (e) {
      const fmt = await chat([
        { role: 'system', content: 'You are a JSON reformatter. Output only valid minified JSON that exactly matches the user-provided schema. No prose.' },
        { role: 'user', content: `Fix and return ONLY valid JSON from this text. Do not add or remove keys: ${content}` },
      ], { temperature: 0 });
      payload = parseOutermostJson(fmt);
    }

    const { narration_markdown, state, chapter_complete, chapter_title, summary } = payload || {};
    if (!narration_markdown || !state) return res.status(422).json({ error: 'Model did not provide required fields' });
    validateStateShape(state);

    s.state = { ...state, session_id: String(s.id) };
    s.lastMarkdown = narration_markdown;
    if (chapter_complete) {
      s.chapters.push({ title: chapter_title || `Chapter ${s.chapters.length + 1}`, summary: summary || '' });
    }
    saveSession(s);

    return res.status(200).json({
      id: s.id,
      narration_markdown,
      state: s.state,
      chapter_complete: !!chapter_complete,
      chapters: s.chapters,
      updatedAt: s.updatedAt,
    });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
