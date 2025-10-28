import { chat } from '../../lib/openrouter';

const SYSTEM = `As ElinityAI narrator, continue a collaborative myth. OUTPUT JSON: { text }. 3-6 sentences, lyrical, incorporate current characters and decisions. No extra text.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { world, characters = [], rounds = [], player = '' } = req.body || {};
    const context = `World: ${world?.name||'Unknown'} (${world?.theme||''})\nCharacters: ${characters.map(c=> c.type+': '+c.text).join('; ')}\nSo far: ${rounds.map(r=> `[${r.round}] ${r.text}`).join(' ')}\nPlayer adds: ${player}`;
    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: context },
    ]);
    const json = parseJson(content);
    return res.json(json);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

function parseJson(s) { const i=s.indexOf('{'); const j=s.lastIndexOf('}'); if(i<0||j<0) throw new Error('Model did not return JSON'); return JSON.parse(s.slice(i,j+1)); }
