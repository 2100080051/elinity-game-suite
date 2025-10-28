import { addJournal } from '../../lib/store';

export default function handler(req,res){
  if (req.method!== 'POST') return res.status(405).json({ error:'Method not allowed' });
  const { id, text } = req.body||{};
  try { const data = addJournal(id, text); res.status(200).json(data); }
  catch(e){ res.status(400).json({ error: e.message }); }
}
