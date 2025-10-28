import { saveFortune } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
  const result = saveFortune(sessionId);
  if (!result.ok) return res.status(400).json(result);
  res.status(200).json(result);
}
