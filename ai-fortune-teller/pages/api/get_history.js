import { getHistory } from '../../lib/store';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { sessionId } = req.query || {};
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
  const data = getHistory(sessionId);
  res.status(200).json(data);
}
