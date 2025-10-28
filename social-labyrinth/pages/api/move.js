import { move } from '../../lib/store';

export default function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { gameId, playerId, label } = req.body || {};
  try {
    const data = move(String(gameId), String(playerId), String(label||''));
    if (!data.ok) return res.status(400).json(data);
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ error: String(e.message||e) });
  }
}
