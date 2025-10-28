import { saveLegend } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const legend = saveLegend(req.body || {});
    res.json(legend);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
