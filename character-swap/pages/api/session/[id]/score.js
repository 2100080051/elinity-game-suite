import { SYSTEM_PROMPT, chat, parseJsonLoose } from '../../../../lib/openrouter';
import { getSession, saveSession } from '../../../../lib/store';

export default async function handler(req,res){
  if (req.method!=='POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { id } = req.query;
    const s = getSession(id); if (!s) return res.status(404).json({ error: 'Not found' });
    const swap = s.swap_pair || s.players.slice(0,2);
    const subs = swap.map(p=> ({ player_id: p, text: s.submissions[p] || '' }));
    const payload = { round: s.round, swap_pair: swap, scenario_id: s.scenario_id, scenario_markdown: s.prompt_markdown, submissions: subs };
    const messages = [
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: `Evaluate these submissions. Return STRICT JSON: {round, swap_pair, scenario_id, submissions:[{player_id,text}], scores:[{player_id, humor, empathy, consistency, total, feedback}], feedback_markdown, next_swap_pair}.\nData: ${JSON.stringify(payload)}` }
    ];
    const raw = await chat(messages, { temperature: 0.3 });
    const j = parseJsonLoose(raw);
    s.scores = j.scores || [];
    s.log.push({ round: s.round, swap_pair: swap, scenario_id: s.scenario_id, submissions: subs, scores: s.scores });
    saveSession(s);
    res.status(200).json({ session: s, feedback_markdown: j.feedback_markdown || '', result: j });
  }catch(e){ res.status(500).json({ error: e.message }); }
}
