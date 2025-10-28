import { analyzeMusicInternal, startSession } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { playlistUrl, mood } = req.body || {};
  // Ensure a session exists
  const session = await startSession({ playlistUrl, mood: mood || 'calm' });
  const analyzed = await analyzeMusicInternal({ playlistUrl, suggestMood: session.mood });
  session.mood = analyzed.mood; session.tempo = analyzed.tempo; session.emotion_tags = analyzed.emotion_tags;
  res.status(200).json({ id: session.id, mood: session.mood, tempo: session.tempo, emotion_tags: session.emotion_tags });
}
