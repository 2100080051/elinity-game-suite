import { getState } from '../../lib/store';

export default async function handler(req, res){
  try{
    return res.status(200).json(getState());
  }catch(e){ return res.status(500).json({ error: e.message||'Server error' }); }
}
