import { finishComic } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId } = req.body||{}; try{ const r = finishComic(sessionId); res.status(200).json(r); }catch(e){ res.status(400).json({error:e.message}); } }
