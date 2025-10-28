import { chat } from '../../../../lib/openrouter';
import { getRound, saveRound } from '../../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { id } = req.query;
    const round = getRound(id);
    if(!round) return res.status(404).json({error:'Round not found'});

    // New secret question
    const sys = { role:'system', content: 'Generate a single, short, natural-language truth-question only. No preamble.' };
    const user = { role:'user', content: 'Return ONLY the question text.' };
    const secret_question = (await chat([sys, user])).trim().replace(/^"|"$/g,'');

    // Rotate/randomize questioner
    const idx = Math.floor(Math.random()*round.players.length);
    round.questioner_id = round.players[idx];
    round.question_id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    round.secret_question = secret_question;
    round.turn = 1;
    round.attempts = 0;
    round.solved = false;
    round.solver_id = null;
    round.log = [];
    saveRound(round);

    return res.status(200).json({ round });
  }catch(e){
    return res.status(500).json({ error: e.message||'Server error' });
  }
}
