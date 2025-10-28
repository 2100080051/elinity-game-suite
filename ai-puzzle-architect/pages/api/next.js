import { SYSTEM_PROMPT, chat, parseJsonLoose } from '../../lib/openrouter';
import { createPuzzle, getSession } from '../../lib/store';

export default async function handler(req,res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { session_id, last_result, fallback } = req.body || {};
    const session = session_id ? getSession(session_id) : null;
    let desired = { type: fallback?.type || 'word', difficulty_preference: fallback?.difficulty || 'easy' };
    if (last_result?.next_puzzle_type && last_result?.next_difficulty){
      desired = { type: last_result.next_puzzle_type, difficulty_preference: last_result.next_difficulty };
    }
    const messages = [
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: `Generate a puzzle for the following request. Return STRICT JSON with keys: puzzle_id, type, difficulty, prompt_markdown, supporting_data, solution_spec.\nRequest: ${JSON.stringify(desired)}` }
    ];
    const raw = await chat(messages, { temperature: 0.4 });
    const j = parseJsonLoose(raw);
    const puzzle = createPuzzle({
      session_id: session?.id || null,
      id: j.puzzle_id, // honored by createPuzzle
      type: j.type || desired.type,
      difficulty: j.difficulty || desired.difficulty_preference,
      prompt_markdown: j.prompt_markdown || '',
      supporting_data: j.supporting_data || {},
      solution_spec: j.solution_spec || {}
    });
    res.status(200).json({ session, puzzle });
  }catch(e){ res.status(500).json({ error: e.message }); }
}
