import { chat } from '../../../lib/openrouter';
import { startRound } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { players = ['Player A','Player B','Player C','Player D'], hintThreshold = 3 } = req.body||{};
    const questionerIdx = Math.floor(Math.random()*players.length);
    const questioner_id = players[questionerIdx];

    // Ask model to generate a unique secret question
    const sys = { role:'system', content: 'Generate a single, short, natural-language truth-question only. No preamble. Examples: "Which two fruits did I combine to make a smoothie?", "What two cities did I visit in a single year?"' };
    const user = { role:'user', content: 'Return ONLY the question text.' };
    const secret_question = (await chat([sys, user])).trim().replace(/^"|"$/g,'');
    const question_id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    const round = startRound({ players, questioner_id, question_id, secret_question, hintThreshold });

    return res.status(200).json({ round });
  }catch(e){
    return res.status(500).json({ error: e.message||'Server error' });
  }
}
