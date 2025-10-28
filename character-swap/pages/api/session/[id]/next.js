import { SYSTEM_PROMPT, chat, parseJsonLoose } from '../../../../lib/openrouter';
import { getSession, saveSession } from '../../../../lib/store';

export default async function handler(req,res){
  if (req.method!=='POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { id } = req.query;
    const s = getSession(id); if (!s) return res.status(404).json({ error: 'Not found' });
    const nextSwap = s.scores?.length? (s.scores.next_swap_pair || null) : null; // may be embedded, else null
    const ask = { roster: s.roster, last_swap_pair: s.swap_pair, suggested_next: nextSwap };
    const messages = [
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: `Create the next round. Return STRICT JSON: { round, swap_pair:[string,string], scenario_id, prompt_markdown, background_markdown }.\nSession: ${JSON.stringify(ask)}` }
    ];
    const raw = await chat(messages, { temperature: 0.7 });
    const j = parseJsonLoose(raw);
    s.round = (s.round||1)+1; s.swap_pair = j.swap_pair || s.players.slice(0,2);
    s.scenario_id = j.scenario_id || `scene-${s.round}`; s.prompt_markdown = j.prompt_markdown || ''; s.background_markdown = j.background_markdown || '';
    s.submissions = {}; s.scores = [];
    saveSession(s);
    res.status(200).json({ session: s });
  }catch(e){ res.status(500).json({ error: e.message }); }
}
