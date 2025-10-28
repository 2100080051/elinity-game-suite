import { getRound, saveRound } from '../../../../lib/store';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { id } = req.query;
    const r = getRound(id);
    if (!r) return res.status(404).json({ error: 'Round not found' });

    const { meme_id, delta = 1, voter = '' } = (req.body || {});
    if (!meme_id) return res.status(400).json({ error: 'Missing meme_id' });
    const d = Number(delta);
    if (![1, -1].includes(d)) return res.status(400).json({ error: 'delta must be 1 or -1' });

    r.votes.push({ meme_id, delta: d, voter });
    saveRound(r);
    return res.status(200).json({ round_id: r.id, votes: r.votes });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
