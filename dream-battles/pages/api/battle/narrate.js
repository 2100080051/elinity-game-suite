import { chat } from '../../../lib/openrouter';
import { getCard } from '../../../lib/store';

const SYSTEM = `You are the AI narrator for Dream Battles.
When two cards face off, narrate the duel in vivid, dramatic prose (80–120 words), blending visual and thematic essences.
At the very top, include a single header line: WINNER: <id> where <id> is the winning card id.
Then a blank line, then the narrative paragraph.
Tone: Surreal, cinematic, lightly whimsical. Use sensory adjectives and dynamic verbs.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { a_id, b_id, a, b } = req.body || {};
    const cardA = a || getCard(a_id);
    const cardB = b || getCard(b_id);
    if (!cardA || !cardB) return res.status(400).send('Missing cards');
    const tokens = (c)=> [c.title, c.description, c.fragment].filter(Boolean).join(' ');
    const user = `Card A [id:${cardA.id} | player:${cardA.player}]\n${tokens(cardA)}\n\nCard B [id:${cardB.id} | player:${cardB.player}]\n${tokens(cardB)}\n\nRespond with header then narrative.`;
    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user },
    ]);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(content);
  } catch (e) { return res.status(500).send(e.message); }
}
