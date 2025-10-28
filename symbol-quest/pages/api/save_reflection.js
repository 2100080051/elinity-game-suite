import { saveReflection } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const data = saveReflection(String(id));
  if (!data.ok) return res.status(400).json(data);
  res.status(200).json(data);
}
