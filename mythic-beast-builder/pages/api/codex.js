import { getCodex } from '../../lib/store';
export default function handler(req,res){ try{ res.status(200).json(getCodex()); }catch(e){ res.status(400).json({ error: e.message }); } }
