import { getLegend, deleteLegend } from '../../../lib/store';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  if (req.method === 'GET') {
    const L = getLegend(id);
    if (!L) return res.status(404).json({ error: 'Not found' });
    return res.json(L);
  }
  if (req.method === 'DELETE') {
    const ok = deleteLegend(id);
    return res.json({ ok });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
