import { applyPlayerChoiceInternal } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id, choice } = req.body || {};
  const s = await applyPlayerChoiceInternal(id, choice || '');
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(s);
}
