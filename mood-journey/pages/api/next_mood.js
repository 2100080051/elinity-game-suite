import { nextMood } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId } = req.body||{}; try{ const st = nextMood(sessionId); res.status(200).json(st); }catch(e){ res.status(400).json({error:e.message}); } }
