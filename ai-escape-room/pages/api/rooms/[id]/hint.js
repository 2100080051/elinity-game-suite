import { chat } from '../../../../lib/openrouter';
import { getRoom, saveRoom, timeLeft } from '../../../../lib/store';

const SYSTEM = `You are the AI Game Master for AI Escape Room.
Provide a short optional hint (one line). Reveal only a gentle nudge—do not give the answer. If players are far behind, be slightly more direct.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  const room = getRoom(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  try {
    const context = `Scenario:\n${room.scenario}\nClues so far: ${(room.clues||[]).map(c=>c.text).join(' | ')}`;
    const hint = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: context },
    ]);
    room.hints.push({ text: hint.trim(), time: Date.now() });
    saveRoom(room);
    return res.status(201).json({ hint: hint.trim(), time_left: timeLeft(room) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
