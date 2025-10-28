import { getFortune } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { sessionId, mood, situation, intention } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
  try {
    const fortune = await getFortune(sessionId, { mood, situation, intention });
    res.status(200).json({ sessionId, ...fortune });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}
