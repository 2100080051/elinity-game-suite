import { chat, parseJsonLoose } from '../../../lib/openrouter';
import { getRound, saveRound } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { round_id, remix } = req.body||{};
    const round = getRound(round_id);
    if(!round) return res.status(404).json({error:'Round not found'});

    const sys = { role:'system', content: `${process.env.SYSTEM_PROMPT||''}\nGiven round track_set and remix spec, return final_mix {mixed_track_url, mixed_visual_url}` };
    const user = { role:'user', content: JSON.stringify({ round_id, track_set: round.track_set, remix }) };

    let content; try{ content = await chat([sys, user], { json: true }); }catch(e){ content = '{}'; }
    const parsed = parseJsonLoose(content) || {};
    const final_mix = parsed.final_mix || { mixed_track_url: '', mixed_visual_url: '' };

    round.remix_specs.push(remix);
    round.final_mix = final_mix;
    saveRound(round);

    return res.status(200).json({ final_mix });
  }catch(e){
    return res.status(500).json({ error: e.message||'Server error' });
  }
}
