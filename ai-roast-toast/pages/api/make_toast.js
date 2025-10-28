import { makeToast } from '../../lib/store';

export default async function handler(req,res){
  if (req.method!== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { gameId } = req.body||{};
  try{
    const data = await makeToast(gameId);
    res.status(200).json(data);
  }catch(e){
    res.status(400).json({ error: e.message });
  }
}
