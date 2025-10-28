import { getRound } from '../../../lib/store';

export default async function handler(req, res){
  const { id } = req.query;
  const round = getRound(id);
  if(!round) return res.status(404).json({error:'Round not found'});
  return res.status(200).json({ round });
}
