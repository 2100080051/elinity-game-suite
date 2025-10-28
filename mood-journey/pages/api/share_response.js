import { shareResponse } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId, text } = req.body||{}; try{ const r = shareResponse(sessionId, text); res.status(200).json(r); }catch(e){ res.status(400).json({error:e.message}); } }
