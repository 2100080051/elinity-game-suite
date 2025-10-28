import { listLegacies } from '../../lib/store';

export default function handler(req,res){
  res.status(200).json({ legacies: listLegacies() });
}
