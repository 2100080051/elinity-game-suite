import { getState } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });
  res.status(200).json(getState(String(id)));
}
