import { newSession } from '../../lib/store';
export default async function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); try{ res.status(200).json(newSession()); }catch(e){ res.status(400).json({ error: e.message }); } }
