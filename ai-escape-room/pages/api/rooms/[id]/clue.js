import { chat } from '../../../../lib/openrouter';
import { getRoom, saveRoom, timeLeft } from '../../../../lib/store';

const SYSTEM = `You are the AI Game Master for AI Escape Room.
Issue a single-line clue for the current puzzle. Keep it crisp and evocative. Do not reveal the answer.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  const room = getRoom(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  try {
    const context = `Scenario:\n${room.scenario}\nCurrent puzzle index: ${room.currentIndex}`;
    const clue = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: context },
    ]);
    room.clues.push({ text: clue.trim(), time: Date.now() });
    saveRoom(room);
    return res.status(201).json({ clue: clue.trim(), time_left: timeLeft(room) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
