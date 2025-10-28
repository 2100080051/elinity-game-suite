import { getSession } from '../../../lib/store';

export default async function handler(req, res) {
  const { id } = req.query;
  const s = getSession(id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(s);
}
