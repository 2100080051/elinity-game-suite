import { startGame } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { players } = req.body || {};
  const s = startGame({ players: Array.isArray(players) ? players : [] });
  res.status(200).json({ id: s.id });
}
