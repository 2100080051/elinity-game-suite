import { continueScene } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const data = await continueScene(String(id));
  res.status(200).json(data);
}
