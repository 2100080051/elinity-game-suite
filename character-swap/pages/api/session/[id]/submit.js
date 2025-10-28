import { getSession, saveSession } from '../../../../lib/store';

export default async function handler(req,res){
  if (req.method!=='POST') return res.status(405).json({ error: 'Method not allowed' });
  try{
    const { id } = req.query; const { player_id, text } = req.body || {};
    const s = getSession(id); if (!s) return res.status(404).json({ error: 'Not found' });
    if (!player_id || !text) return res.status(400).json({ error: 'Missing player_id or text' });
    s.submissions[player_id] = String(text).slice(0, 400);
    saveSession(s);
    res.status(200).json({ session: s });
  }catch(e){ res.status(500).json({ error: e.message }); }
}
