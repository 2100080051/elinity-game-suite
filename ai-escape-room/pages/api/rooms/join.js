import { getRoom, saveRoom, timeLeft } from '../../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body || {};
  const room = getRoom(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json({ ...room, time_left: timeLeft(room), current_puzzle: room.puzzles?.[room.currentIndex]?.prompt || 'Awaiting first clue…' });
}
