import { chat, extractJson } from '../../../lib/openrouter';
import { createRoom, listRooms, saveRoom, timeLeft } from '../../../lib/store';
import { generateImage } from '../../../lib/image';

const SYSTEM = `You are the AI Game Master for AI Escape Room – a cooperative, sandbox puzzle‑solving experience.
- Construct an immersive locked‑room scenario with detailed setting, characters, and a high‑level plot hook.
- Issue clear, single‑line clues and riddles, with optional hints that reveal gradually.
- Track a countdown timer, accumulate clue points, and dynamically adjust difficulty.
- After each solution, narrate the room’s reaction and update the environment state.
- Use Markdown with headings: Scenario, Clues, Puzzles, Hints, Timer. Keep it concise and vivid.`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // List rooms for Saved Plays with computed time_left
    const rooms = listRooms().map(r => ({ ...r, time_left: timeLeft(r) }));
    return res.json(rooms);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { players = [], durationSec = 600 } = req.body || {};
    // Ask AI for initial scenario and first puzzle line summary (Markdown)
    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Create a fresh locked‑room scenario. Players: ${players.join(', ')||'Unnamed'}. Provide sections as Markdown.` },
    ]);
    const room = createRoom({ players, durationSec, scenario: content, ambient: null });
    try {
      const img = await generateImage(`Ambient concept art of: ${content.slice(0, 200)}`);
      if (typeof img === 'string') room.ambient = img; else if (img && img.url) room.ambient = img.url;
    } catch {}
    saveRoom(room);
    return res.status(201).json({ ...room, time_left: timeLeft(room), current_puzzle: room.puzzles?.[room.currentIndex]?.prompt || 'Awaiting first clue…' });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
