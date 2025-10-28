import { pickTheme } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { roomId, theme } = req.body||{}; try{ res.status(200).json(pickTheme(roomId, theme)); }catch(e){ res.status(400).json({ error: e.message }); } }
