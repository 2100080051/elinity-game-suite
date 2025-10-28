import { chat } from '../../../lib/openrouter';
import { createSession, listSessions, saveSession } from '../../../lib/store';

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
    if (req.method === 'GET') {
      const list = listSessions().map(s => ({
        id: s.id,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        chapters: s.chapters,
      }));
      return res.status(200).json({ sessions: list });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { title = 'The Long Journey', notes = '' } = (req.body || {});
    const s = createSession();

    const sys = `You are Elinity AI, the epic guide for a weekly RPG called "The Long Journey".
Only output strict JSON. No markdown fences, no commentary. Keep fields concise.
Return an object with EXACTLY these keys:
{
  "chapter_title": string (<= 8 words),
  "recap_markdown": string (<= 180 words),
  "world_markdown": string (<= 180 words),
  "challenges": [ {"id": string, "title": string, "detail": string, "difficulty": "Easy"|"Medium"|"Hard"} ] (3 items),
  "allies": [ {"name": string, "quirk": string, "ability": string} ] (2-3 items),
  "state": {"session_id": string, "acts": [], "characters": [], "locations": [], "items": [], "morale": number, "metaphoric_theme": string}
}`;

    const user = `Initialize a new chapter for a player. Title: ${title}. Notes: ${notes}.
Current state JSON:
${JSON.stringify(s.state)}
Ensure state.session_id = "${s.id}" and morale is an integer from 0 to 100.
Keep recap/world evocative and specific. Do not include code blocks.`;

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

    if (!payload || typeof payload !== 'object') throw new Error('Invalid JSON payload');
    const { chapter_title, recap_markdown, world_markdown, challenges, allies, state } = payload;
    if (!recap_markdown || !world_markdown || !Array.isArray(challenges) || !Array.isArray(allies) || !state) {
      return res.status(422).json({ error: 'Model did not provide required fields' });
    }
    validateStateShape(state);

    s.state = { ...state, session_id: String(s.id) };
    s.lastMarkdown = world_markdown;
    s.chapters.push({ title: chapter_title || 'Chapter 1', summary: recap_markdown });
    saveSession(s);

    return res.status(201).json({
      id: s.id,
      chapter_title: chapter_title || 'Chapter 1',
      recap_markdown,
      world_markdown,
      challenges,
      allies,
      state: s.state,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    });
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
