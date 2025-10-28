import { chat } from '../../lib/openrouter';

const SYSTEM = `You are ElinityAI, the artistic visionary of "Future Artifact Maker" — a playful reflection game where imagination meets foresight.

ROLE:
Guide players to imagine symbolic objects from their possible futures, then transform these ideas into poetic descriptions and artwork.

TASK:
Produce a single, short, open-ended question that invites a player to imagine a future artifact. Keep under 120 characters. No preamble.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const content = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: 'Generate one imaginative question for a player about a future artifact.' }
    ]);
    const prompt = content.trim().replace(/^"|"$/g, '');
    res.json({ prompt });
  } catch (e) {
    res.status(500).json({ error: e.message || 'AI prompt generation failed' });
  }
}
