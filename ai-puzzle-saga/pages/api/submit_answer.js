import { submitAnswer } from '../../lib/store';
export default async function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId, answer } = req.body||{}; try{ res.status(200).json(await submitAnswer(sessionId, answer)); }catch(e){ res.status(400).json({ error: e.message }); } }
