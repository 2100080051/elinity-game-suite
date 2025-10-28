import { chat } from '../../../lib/openrouter';
import { getGame, newGame } from '../../../lib/store';

export default async function handler(req, res){
  try{
    if (req.method === 'GET') {
      const g = getGame();
      if (!g) return res.status(404).json({ error: 'No game' });
      return res.status(200).json({ game: g });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { size=5, players=['Player A','Player B'] } = req.body || {};
    const g = newGame({ size, players });

    const sys = `You are the AI Facilitator for Life Goals Board Game – a hybrid visioning & play board.
Respond in Markdown with sections Board, Roll, Goal, Player Input, AI Journey, Session Log.
For the starting response, output only Board and a one-line instruction under Player Input.`;
    const user = `Create a ${size}x${size} board as a Markdown table with numbered cells labeled "Goal Space" (titles blank).`;
    const md = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ]);

    return res.status(201).json({ game: g, markdown: md });
  }catch(err){
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
