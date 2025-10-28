import { deleteCard, getCard } from '../../../lib/store';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    const card = getCard(id);
    if (!card) return res.status(404).json({ error: 'Not found' });
    return res.json(card);
  }
  if (req.method === 'DELETE') {
    const ok = deleteCard(id);
    return res.json({ ok });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
