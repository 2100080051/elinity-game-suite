import { setMood } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId, playerId, mood } = req.body||{}; try{ res.status(200).json(setMood(sessionId, playerId, mood)); }catch(e){ res.status(400).json({ error: e.message }); } }
