import { startRound, saveGenerated } from '../../../lib/store';
import { chat, parseJsonLoose, SYSTEM_PROMPT } from '../../../lib/openrouter';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { player_id, seed_text } = req.body||{};
    if(!player_id || !seed_text) return res.status(400).json({error:'player_id and seed_text required'});

    const round = startRound({ player_id, seed_text });

    const sys = { role:'system', content: SYSTEM_PROMPT };
    const user = { role:'user', content: JSON.stringify({ player_id, seed_text }) };

    let payload = null;
    try{
      const content = await chat([sys,user], { json: true });
      const parsed = parseJsonLoose(content) || {};
      if(parsed.truths && parsed.lie && parsed.correct_index){
        payload = { truths: parsed.truths, lie: parsed.lie, correct_index: parsed.correct_index, markdown: parsed.markdown || '' };
      }
    }catch(e){ /* ignore */ }

    if(!payload){
      // Fallback demo data when AI not available
      payload = {
        truths: [
          'I practiced in public to overcome stage fright.',
          'I once got a standing ovation from a small crowd.'
        ],
        lie: 'A record label scouted me there and signed me.',
        correct_index: 3,
        markdown: `**Player ${player_id}** – "${seed_text}"
*What’s true?*
1️⃣ I practiced in public to overcome stage fright.
2️⃣ I once got a standing ovation from a small crowd.
3️⃣ A record label scouted me there and signed me.`
      };
    }

    const saved = saveGenerated(round.id, payload);
    return res.status(200).json({ round: saved });
  }catch(e){ return res.status(500).json({ error: e.message||'Server error' }); }
}
