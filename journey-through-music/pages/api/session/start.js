import { startSession } from '../../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { playlistUrl, mood } = req.body || {};
  try {
    const session = await startSession({ playlistUrl, mood });
    res.status(200).json(session);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to start session' });
  }
}
