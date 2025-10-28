import { joinGame } from '../../lib/store';

export default function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { gameId, name } = req.body || {};
  try {
    const data = joinGame(String(gameId), String(name||''));
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ error: String(e.message||e) });
  }
}
