import { chat } from '../../../lib/openrouter';
import { endTurn, getGame } from '../../../lib/store';

export default async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const g = getGame(); if (!g) return res.status(404).json({ error: 'No game' });
    const { description='' } = req.body || {};
    const player = g.players[g.current_player];
    const space = g.current_space;
    const title = g.goals[space] || '';

    const sys = `You are the AI Facilitator for Life Goals Board Game.
Respond in Markdown with sections Board, Roll, Goal, Player Input, AI Journey, Session Log.
In AI Journey, produce a short vivid narrative journey map (<=120 words). Return ONLY Markdown.`;
    const user = `Player ${player} landed on Space ${space} (${title||'untitled'}). Their plan (3 sentences): ${description}. Provide the AI Journey narrative and add a concise Session Log line summarizing this move.`;
    const md = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ]);

    const next_player = endTurn();
    return res.status(200).json({
      player,
      roll: null,
      space,
      description,
      journey_image_url: '',
      next_player,
      markdown: md,
      game: g,
    });
  }catch(err){
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
