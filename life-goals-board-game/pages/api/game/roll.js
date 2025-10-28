import { applyRoll, getGame } from '../../../lib/store';
import { chat } from '../../../lib/openrouter';

export default async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const g = getGame(); if (!g) return res.status(404).json({ error: 'No game' });

    const roll = Math.floor(1 + Math.random()*6);
    const move = applyRoll(roll);
    const currentTitle = g.goals[g.current_space] || '';

    const sys = `You are the AI Facilitator for Life Goals Board Game.
Respond in Markdown with sections Board, Roll, Goal, Player Input, AI Journey, Session Log.
Return ONLY Markdown content.`;
    const user = `We have a ${g.size}x${g.size} grid, current move: Player ${move.player} rolled ${move.roll}, moved from Space ${move.from} to Space ${move.to} (${currentTitle||'untitled'}).
Provide a one-paragraph Roll summary, then in Goal invite the player to name this Goal Space if untitled. In Player Input, prompt a 30-second, 3-sentence explanation.`;
    const md = await chat([
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ]);

    return res.status(200).json({
      player: move.player,
      roll: move.roll,
      space: move.to,
      description: '',
      journey_image_url: '',
      next_player: move.player,
      markdown: md,
      game: g,
    });
  }catch(err){
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
