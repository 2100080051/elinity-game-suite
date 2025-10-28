import { getRound } from '../../../lib/store';

export default async function handler(req, res){
  const { id } = req.query;
  const r = getRound(id);
  if(!r) return res.status(404).json({error:'Not found'});
  return res.status(200).json({ round: r });
}
