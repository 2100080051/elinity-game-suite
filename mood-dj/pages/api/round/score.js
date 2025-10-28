import { chat, parseJsonLoose } from '../../../lib/openrouter';
import { getRound, saveRound } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { round_id } = req.body||{};
    const round = getRound(round_id);
    if(!round) return res.status(404).json({error:'Round not found'});

    const sys = { role:'system', content: `${process.env.SYSTEM_PROMPT||''}\nReturn {score, feedback} evaluating cohesion, energy, and optional audience rating.` };
    const user = { role:'user', content: JSON.stringify({ round_id, player_moods: round.player_moods, final_mix: round.final_mix, track_set: round.track_set }) };

    let content; try{ content = await chat([sys, user], { json: true }); }catch(e){ content = '{}'; }
    const parsed = parseJsonLoose(content) || {};
    const score = parsed.score || { score: Math.floor(70+Math.random()*30), feedback: 'Solid vibes!' };

    round.score = score;
    saveRound(round);

    return res.status(200).json({ score });
  }catch(e){
    return res.status(500).json({ error: e.message||'Server error' });
  }
}
