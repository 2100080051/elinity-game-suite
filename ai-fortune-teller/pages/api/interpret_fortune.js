import { interpretFortune } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { sessionId, reflection } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
  const result = await interpretFortune(sessionId, String(reflection || ''));
  res.status(200).json(result);
}
