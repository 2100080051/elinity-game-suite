import { listLegends } from '../../../lib/store';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.json(listLegends());
}
