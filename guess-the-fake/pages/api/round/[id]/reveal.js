import { revealRound, getRound } from '../../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { id } = req.query;
  try{
    const r = getRound(id);
    if(!r) return res.status(404).json({error:'Round not found'});
    const rr = revealRound(id);
    return res.status(200).json({ round: rr });
  }catch(e){ return res.status(500).json({ error: e.message||'Server error' }); }
}
