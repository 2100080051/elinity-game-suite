import { chat } from '../../lib/openrouter';

const SYSTEM = `ROLE: As ElinityAI, accept a short character seed (type + name/trait) and return lore note.
OUTPUT JSON: { type, text, note }. Keep note one sentence, vivid, mythic.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { type, text, world } = req.body || {};
    if (!type || !text) return res.status(400).json({ error: 'Missing type or text' });
    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `World: ${world?.name||'Unknown'} | Type: ${type} | Seed: ${text}` },
    ]);
    const json = parseJson(content);
    return res.json(json);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

function parseJson(s) { const i=s.indexOf('{'); const j=s.lastIndexOf('}'); if(i<0||j<0) throw new Error('Model did not return JSON'); return JSON.parse(s.slice(i,j+1)); }
