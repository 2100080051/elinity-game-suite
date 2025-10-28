import { getRoom, saveRoom, timeLeft } from '../../../../lib/store';

export default async function handler(req, res) {
  const { id } = req.query;
  const room = getRoom(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json({
    id: room.id,
    players: room.players,
    scenario: room.scenario,
    ambient: room.ambient,
    points: room.points,
    clues: room.clues,
    hints: room.hints,
    current_puzzle: room.puzzles?.[room.currentIndex]?.prompt || 'Solve the opening riddle to begin',
    time_left: timeLeft(room),
  });
}
