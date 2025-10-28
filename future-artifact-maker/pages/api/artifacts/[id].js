import { getArtifact, deleteArtifact } from '../../../lib/store';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' });
  if (req.method === 'GET') {
    const a = getArtifact(id);
    if (!a) return res.status(404).json({ error: 'Not found' });
    return res.json(a);
  }
  if (req.method === 'DELETE') {
    const ok = deleteArtifact(id);
    return res.json({ ok });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
