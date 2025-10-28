import { getState } from '../../lib/store';

export default function handler(req,res){
  const { gameId } = req.query;
  try{
    const data = getState(gameId);
    res.status(200).json(data);
  }catch(e){
    res.status(400).json({ error: e.message });
  }
}
