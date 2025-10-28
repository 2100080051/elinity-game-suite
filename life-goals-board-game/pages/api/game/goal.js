import { getGame, nameGoal } from '../../../lib/store';

export default async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const g = getGame(); if (!g) return res.status(404).json({ error: 'No game' });
    const { index, title } = req.body || {};
    if (!index) return res.status(400).json({ error: 'Missing index' });
    nameGoal(Number(index), String(title||''));
    return res.status(200).json({ goals: g.goals, board: g.board });
  }catch(err){
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
