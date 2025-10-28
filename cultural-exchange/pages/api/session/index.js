import { chat, parseJsonLoose } from '../../../lib/openrouter';
import { createSession, saveSession } from '../../../lib/store';

export default async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { culture = 'Let AI surprise me' } = req.body || {};
    const s = createSession({ culture: '' });

    const sys = `You are the AI Facilitator for Cultural Exchange – a dynamic, educational role-playing experience.
Return ONLY JSON with keys: { "culture": string, "hook_markdown": string, "roles": [string], "facts": [string], "state": {"culture":string, "scene":string, "participants": [], "actions": [], "facts": [] } }.
Do NOT include code fences or commentary. Keep concise, evocative language.`;
    const user = `Start a new session. Culture preference: ${culture}. Generate a narrative hook, list 3-5 role options, and 1-3 trivia facts. State.scene should be a short scene title.`;

    let content = await chat([ { role:'system', content: sys }, { role:'user', content: user } ]);
    let payload;
    try { payload = parseJsonLoose(content); } catch (e) {
      const fmt = await chat([
        { role:'system', content:'You are a JSON reformatter. Return ONLY valid, minified JSON with the same keys.'},
        { role:'user', content:`Fix this into valid JSON: ${content}`}
      ], { temperature: 0 });
      payload = parseJsonLoose(fmt);
    }

    s.culture = payload.culture || 'Cultural Exchange';
    s.scene = payload?.state?.scene || '';
    s.roles = Array.isArray(payload.roles) && payload.roles.length ? payload.roles : s.roles;
    s.facts = Array.isArray(payload.facts) ? payload.facts : [];
    saveSession(s);

    return res.status(201).json({ id: s.id, culture: s.culture, markdown: payload.hook_markdown || '', roles: s.roles });
  }catch(err){
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
