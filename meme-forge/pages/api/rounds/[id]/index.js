import { getRound } from '../../../../lib/store';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const r = getRound(id);
    if (!r) return res.status(404).json({ error: 'Round not found' });
    return res.status(200).json({
      round_id: r.id,
      prompt: r.prompt,
      captions: r.captions,
      memes: r.memes,
      votes: r.votes,
      winner: r.winner,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
