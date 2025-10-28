import { chat } from '../../lib/store';

export default function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { gameId, playerId, message } = req.body || {};
  try {
    const data = chat(String(gameId), String(playerId), String(message||''));
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ error: String(e.message||e) });
  }
}
