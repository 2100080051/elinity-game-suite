import { getState } from '../../lib/store';

export default function handler(req, res) {
  const { id } = req.query;
  const s = getState(id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(s);
}
