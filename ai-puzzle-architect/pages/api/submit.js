import { SYSTEM_PROMPT, chat, parseJsonLoose } from '../../lib/openrouter';
import { getPuzzle, getSession } from '../../lib/store';

export default async function handler(req,res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { player_id='You', puzzle_id, answer } = req.body || {};
    if (!puzzle_id) return res.status(400).json({ error: 'Missing puzzle_id' });
    const puzzle = getPuzzle(puzzle_id);
    if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });
    const session = puzzle.session_id ? getSession(puzzle.session_id) : null;

    const messages = [
      { role:'system', content: SYSTEM_PROMPT },
      { role:'user', content: `Evaluate the player's answer. Return STRICT JSON: {player_id, puzzle_id, answer, is_correct, score, next_puzzle_type, next_difficulty, feedback_markdown}.\nPuzzle: ${JSON.stringify({ id:puzzle.id, type:puzzle.type, difficulty:puzzle.difficulty, prompt_markdown:puzzle.prompt_markdown, supporting_data:puzzle.supporting_data, solution_spec:puzzle.solution_spec })}\nAnswer: ${JSON.stringify(answer)}` }
    ];
    const raw = await chat(messages, { temperature: 0.2 });
    const j = parseJsonLoose(raw);
    res.status(200).json({ result: j, feedback_markdown: j.feedback_markdown || '' });
  }catch(e){ res.status(500).json({ error: e.message }); }
}
