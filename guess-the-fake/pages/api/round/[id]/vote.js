import { submitVotes, getRound } from '../../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { id } = req.query;
  try{
    const { votes=[] } = req.body||{};
    if(!Array.isArray(votes)) return res.status(400).json({error:'votes must be an array'});
    const r = getRound(id);
    if(!r) return res.status(404).json({error:'Round not found'});
    submitVotes(id, votes);
    return res.status(200).json({ ok:true });
  }catch(e){ return res.status(500).json({ error: e.message||'Server error' }); }
}
