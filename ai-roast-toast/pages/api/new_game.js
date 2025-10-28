import { newGame } from '../../lib/store';

export default function handler(req,res){
  if (req.method!== 'POST') return res.status(405).json({error:'Method not allowed'});
  const data = newGame();
  res.status(200).json(data);
}
