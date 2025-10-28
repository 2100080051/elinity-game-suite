import { newLegacy } from '../../lib/store';

export default function handler(req,res){
  if (req.method!=='POST') return res.status(405).json({ error:'Method not allowed' });
  const { name } = req.body||{};
  const data = newLegacy(name);
  res.status(200).json(data);
}
