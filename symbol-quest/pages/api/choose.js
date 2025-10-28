import { chooseAction } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id, index } = req.body || {};
  if (!id || typeof index !== 'number') return res.status(400).json({ error: 'Missing id or index' });
  const data = await chooseAction(String(id), Number(index));
  if (data?.error) return res.status(400).json(data);
  res.status(200).json(data);
}
