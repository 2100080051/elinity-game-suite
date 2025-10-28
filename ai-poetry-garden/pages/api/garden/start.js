import { startRound } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { seeds=[] } = req.body||{};
    if(!Array.isArray(seeds) || seeds.length===0) return res.status(400).json({error:'seeds required'});
    const round = startRound({ seeds });
    return res.status(200).json({ round });
  }catch(e){ return res.status(500).json({ error: e.message||'Server error' }); }
}
