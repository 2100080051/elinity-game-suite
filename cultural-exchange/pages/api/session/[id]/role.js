import { getSession, saveSession, claimRole } from '../../../../lib/store';

export default async function handler(req, res){
  try{
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { id } = req.query;
    const s = getSession(id); if (!s) return res.status(404).json({ error: 'Session not found' });
    const { player_id='You', role='' } = req.body || {};
    claimRole(s, player_id, role);
    return res.status(200).json({ session: s });
  }catch(err){
    const status = err?.status || 500;
    return res.status(status).json({ error: err.message || String(err) });
  }
}
