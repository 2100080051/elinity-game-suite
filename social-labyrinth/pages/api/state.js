import { getState } from '../../lib/store';

export default function handler(req, res){
  const { gameId, playerId } = req.query || {};
  if (!gameId || !playerId) return res.status(400).json({ error: 'Missing params' });
  try {
    res.status(200).json(getState(String(gameId), String(playerId)));
  } catch (e) {
    res.status(400).json({ error: String(e.message||e) });
  }
}
