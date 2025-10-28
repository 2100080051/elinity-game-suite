import { doJudge } from '../../lib/store';
export default async function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { roomId } = req.body||{}; try{ res.status(200).json(await doJudge(roomId)); }catch(e){ res.status(400).json({ error: e.message }); } }
