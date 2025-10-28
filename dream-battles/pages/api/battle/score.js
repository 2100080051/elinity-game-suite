import { addPoint, getScores } from '../../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { winner_id, winner_player } = req.body || {};
    if (!winner_id) return res.status(400).json({ error: 'winner_id required' });
    if (!winner_player) return res.status(400).json({ error: 'winner_player required' });
    const points = addPoint(winner_player);
    return res.json({ winner_id, score_diff: 1, current_scores: getScores(), winner_points: points });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
