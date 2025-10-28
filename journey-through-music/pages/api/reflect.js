import { reflectInternal } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id, text } = req.body || {};
  const s = await reflectInternal(id, text || '');
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(s);
}
