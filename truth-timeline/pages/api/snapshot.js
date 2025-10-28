import { makeSnapshot } from '../../lib/store';
export default async function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { sessionId } = req.body||{}; try{ res.status(200).json(await makeSnapshot(sessionId)); }catch(e){ res.status(400).json({ error: e.message }); } }
