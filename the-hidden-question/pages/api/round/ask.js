import { chat, parseJsonLoose } from '../../../lib/openrouter';
import { getRound, saveRound } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { round_id, player_id, question } = req.body||{};
    const round = getRound(round_id);
    if(!round) return res.status(404).json({error:'Round not found'});
    if(round.solved) return res.status(200).json({ ok:true, message:'Round solved', round });

    // Build evaluation request for the model
    const sys = { role:'system', content: `You evaluate yes/no questions against a hidden question. Hidden: ${round.secret_question}. Return JSON only with keys: turn, player_id, submitted_question, matched (boolean), clue (string or null), game_over (boolean). If the submitted question effectively identifies or resolves the hidden question, set matched=true and game_over=true. If not, and the number of false attempts so far is >= ${round.hintThreshold}, provide a very short neutral clue (one line); else set clue to null.` };
    const user = { role:'user', content: JSON.stringify({ turn: round.turn, player_id, submitted_question: question }) };

    const content = await chat([sys, user], { json: true });
    const parsed = parseJsonLoose(content) || {};
    const matched = !!parsed.matched;
    const clue = parsed.clue || null;
    const game_over = !!parsed.game_over || matched;

    // Update round state
    round.log.push({ turn: round.turn, player_id, submitted_question: question, matched, clue });
    if(matched || game_over){ round.solved = true; round.solver_id = player_id; }
    else { round.turn += 1; round.attempts += matched ? 0 : 1; }
    saveRound(round);

    return res.status(200).json({ turn: round.turn, player_id, submitted_question: question, matched, clue, game_over });
  }catch(e){
    return res.status(500).json({ error: e.message||'Server error' });
  }
}
