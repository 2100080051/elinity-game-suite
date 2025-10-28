import { getSession } from '../../../../lib/store';

export default async function handler(req, res){
  try{
    const { id } = req.query;
    const s = getSession(id);
    if (!s) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json({ session: s, markdown: '' });
  }catch(err){
    return res.status(500).json({ error: err.message || String(err) });
  }
}
