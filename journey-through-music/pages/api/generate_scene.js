import { generateSceneInternal, getSession } from '../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { id } = req.body || {};
  const s = getSession(id);
  if (!s) return res.status(404).json({ error: 'Not found' });
  const scene = await generateSceneInternal({ id, mood: s.mood, tempo: s.tempo, emotion_tags: s.emotion_tags });
  if (scene) {
    s.scene = { ...s.scene, ...scene };
  }
  res.status(200).json(s);
}
