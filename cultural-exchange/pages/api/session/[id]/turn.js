import { chat, parseJsonLoose } from '../../../../lib/openrouter';
import { getSession, saveSession } from '../../../../lib/store';

export default async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { id } = req.query;
    const s = getSession(id); if (!s) return res.status(404).json({ error: 'Session not found' });
    const { player_id='You', role='', action_text='' } = req.body || {};
    if (!action_text) return res.status(400).json({ error: 'Missing action_text' });

    const sys = `You are the AI Facilitator for Cultural Exchange – a dynamic, educational role-playing experience.
Deliver Markdown sections: Hook, Roles, Player Turn, AI Adaptation, Learning Flashcard. Keep Hook minimal or omit if redundant.
Return ONLY JSON with keys: { "ai_response_text": string, "facts": [string], "markdown": string }.`;
    const user = `Culture: ${s.culture}. Scene: ${s.scene}. Participants: ${JSON.stringify(s.participants)}. Facts so far: ${JSON.stringify(s.facts)}.
Player ${player_id} (${role||'unclaimed'}) says: ${action_text} (1–2 sentences).
Expand the scene with sensory details, alternate pathways, and include 1-3 new cultural facts. Provide the markdown sections with a concise Learning Flashcard bullet list.`;

    let content = await chat([
      { role:'system', content: sys },
      { role:'user', content: user }
    ]);
    let payload;
    try { payload = parseJsonLoose(content); } catch (e) {
      const fmt = await chat([
        { role:'system', content:'You are a JSON reformatter. Return ONLY valid, minified JSON with the same keys.'},
        { role:'user', content:`Fix into valid JSON: ${content}`}
      ], { temperature: 0 });
      payload = parseJsonLoose(fmt);
    }

    s.turn_number += 1;
    s.actions.push({ turn_number: s.turn_number, player_id, action_text, ai_response_text: payload.ai_response_text||'' });
    if (Array.isArray(payload.facts)) s.facts.push(...payload.facts);
    saveSession(s);

    return res.status(200).json({
      turn_number: s.turn_number,
      player_id,
      action_text,
      ai_response_text: payload.ai_response_text || '',
      markdown: payload.markdown || '',
      session: s,
    });
  }catch(err){
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
