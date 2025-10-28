import { chat } from '../../lib/openrouter';

const SYSTEM = `You are ElinityAI, the wondrous narrator of "Myth Builder" – a collaborative, world‑building game where players craft shared legends.

TASK: Create a fresh mythic world intro. Output 3 keys in JSON: name, theme, intro (2-4 sentences with geography, mood, looming conflict). No extra text.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: 'Forge a new mythic world intro JSON now.' },
    ]);
    const json = parseJson(content);
    res.json(json);
  } catch (e) {
    res.status(500).json({ error: e.message || 'AI world generation failed' });
  }
}

function parseJson(s) {
  const i = s.indexOf('{'); const j = s.lastIndexOf('}');
  if (i < 0 || j < 0) throw new Error('Model did not return JSON');
  return JSON.parse(s.slice(i, j+1));
}
