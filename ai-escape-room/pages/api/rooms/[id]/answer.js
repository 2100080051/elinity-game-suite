import { chat, extractJson } from '../../../../lib/openrouter';
import { getRoom, saveRoom, timeLeft } from '../../../../lib/store';

const SYSTEM = `You are the AI Game Master for AI Escape Room.
Evaluate the player's answer for the current puzzle. Respond with STRICT JSON only:
{ "correct": true|false, "narration": "80-120 words reaction", "delta_points": number, "advance": true|false }
No code fences, no extra text.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.query;
  const { answer } = req.body || {};
  const room = getRoom(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!answer) return res.status(400).json({ error: 'answer required' });
  try {
    const context = `Scenario:\n${room.scenario}\nClues: ${(room.clues||[]).map(c=>c.text).join(' | ')}\nPlayer answer: ${answer}`;
    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: context },
    ]);
    let json;
    try { json = extractJson(content); } catch {
      return res.status(422).send('Model did not return valid JSON.');
    }
    // Update room state
    if (typeof json.delta_points === 'number') room.points += json.delta_points;
    if (json.correct && json.advance) room.currentIndex = Math.min((room.currentIndex||0)+1, (room.puzzles?.length||0));
    saveRoom(room);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(json.narration || (json.correct ? 'Correct.' : 'Incorrect.'));
  } catch (e) { return res.status(500).send(e.message); }
}
