import { saveTitle } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId, title } = req.body||{}; try{ res.status(200).json(saveTitle(sessionId, title)); }catch(e){ res.status(400).json({ error: e.message }); } }
