import { startSession } from '../../lib/store';
export default async function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId, players, theme, palette } = req.body||{}; try{ const st = await startSession(sessionId, { players, theme, palette }); res.status(200).json(st); }catch(e){ res.status(400).json({error:e.message}); } }
