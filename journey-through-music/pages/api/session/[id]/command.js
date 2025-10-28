import { commandSession } from '../../../../lib/store';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { command } = req.body || {};
  const s = commandSession(id, command || '');
  if (!s) return res.status(404).json({ error: 'Not found' });
  res.status(200).json(s);
}
