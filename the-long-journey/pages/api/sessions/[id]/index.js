import { getSession } from '../../../../lib/store';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const s = getSession(id);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json({
      id: s.id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      chapters: s.chapters,
      lastMarkdown: s.lastMarkdown,
      state: s.state,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || String(err) });
  }
}
