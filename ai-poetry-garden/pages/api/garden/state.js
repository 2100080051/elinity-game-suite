import { getGarden } from '../../../lib/store';

export default async function handler(req, res){
  if(req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  try{
    const garden = getGarden();
    return res.status(200).json({ garden });
  }catch(e){ return res.status(500).json({ error: e.message||'Server error' }); }
}
