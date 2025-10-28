import { joinRoom } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { roomId, name } = req.body||{}; try{ res.status(200).json(joinRoom(roomId, name)); }catch(e){ res.status(400).json({ error: e.message }); } }
