import { SYSTEM_PROMPT, chat, parseJsonLoose } from '../../../lib/openrouter';
import { createSession, getSession, saveSession } from '../../../lib/store';

export default async function handler(req,res){
  if (req.method==='POST'){
    try{
      const { players=['You','Partner'] } = req.body || {};
      // Create base session
      const s = createSession({ players });
      const messages = [
        { role:'system', content: SYSTEM_PROMPT },
        { role:'user', content: `Start the game. Return STRICT JSON: { roster:[{name,background,quirks[]}], round, swap_pair:[string,string], scenario_id, prompt_markdown, background_markdown }.\nPlayers: ${JSON.stringify(players)}` }
      ];
      const raw = await chat(messages, { temperature: 0.7 });
      const j = parseJsonLoose(raw);
      s.roster = j.roster || []; s.round = j.round || 1; s.swap_pair = j.swap_pair || players.slice(0,2);
      s.scenario_id = j.scenario_id || `scene-${s.round}`; s.prompt_markdown = j.prompt_markdown || ''; s.background_markdown = j.background_markdown || '';
      saveSession(s);
      return res.status(200).json({ session: s });
    }catch(e){ return res.status(500).json({ error: e.message }); }
  }
  if (req.method==='GET'){
    const ids = Array.from((globalThis.__CS__?.sessions||new Map()).keys());
    return res.status(200).json({ sessions: ids });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
