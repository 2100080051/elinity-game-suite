import { startGame } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const data = await startGame();
  res.status(200).json(data);
}
