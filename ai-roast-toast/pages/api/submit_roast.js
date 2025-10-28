import { submitRoast } from '../../lib/store';

export default function handler(req,res){
  if (req.method!== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { gameId, playerId, text } = req.body||{};
  try{
    const data = submitRoast(gameId, playerId, text);
    res.status(200).json(data);
  }catch(e){
    res.status(400).json({ error: e.message });
  }
}
