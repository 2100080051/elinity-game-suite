import { SYSTEM_PROMPT, chat, parseJsonLoose } from '../../lib/openrouter';
import { createSession, createPuzzle, getSession, saveSession } from '../../lib/store';

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { type, difficulty_preference, mode='solo', players=['You'], session_id } = req.body || {};
    if (!type || !difficulty_preference) return res.status(400).json({ error: 'Missing type or difficulty_preference' });

    let session = session_id ? getSession(session_id) : null;
    if (!session){ session = createSession({ mode, players: players.map(p=>({ player_id:p, score:0 })) }); }

    const userPayload = { type, difficulty_preference };
    const messages = [
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: `Generate a puzzle for the following request. Return STRICT JSON with keys: puzzle_id, type, difficulty, prompt_markdown, supporting_data, solution_spec.\nRequest: ${JSON.stringify(userPayload)}` }
    ];
    const raw = await chat(messages, { temperature: 0.4 });
    const j = parseJsonLoose(raw);
    const puzzle = createPuzzle({
      session_id: session.id,
      id: j.puzzle_id, // honored by createPuzzle so lookups use this ID
      type: j.type || type,
      difficulty: j.difficulty || difficulty_preference,
      prompt_markdown: j.prompt_markdown || '',
      supporting_data: j.supporting_data || {},
      solution_spec: j.solution_spec || {}
    });
    res.status(200).json({ session, puzzle });
  }catch(e){
    res.status(500).json({ error: e.message });
  }
}
