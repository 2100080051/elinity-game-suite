import { getPuzzle, getSession } from '../../lib/store';

export default async function handler(req,res){
  try{
    const { id } = req.query;
    const puzzle = getPuzzle(id);
    if (!puzzle) return res.status(404).json({ error: 'Not found' });
    const session = puzzle.session_id ? getSession(puzzle.session_id) : null;
    res.status(200).json({ puzzle, session });
  }catch(e){ res.status(500).json({ error: e.message }); }
}
