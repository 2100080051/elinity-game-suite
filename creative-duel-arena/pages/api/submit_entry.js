import { submitEntry } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id, playerId, entry } = req.body || {};
  const s = submitEntry(id, playerId, entry);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(s);
}
