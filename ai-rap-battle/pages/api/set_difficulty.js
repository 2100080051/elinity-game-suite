import { setDifficulty } from '../../lib/store';
export default function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'}); const { roomId, difficulty } = req.body||{}; try{ res.status(200).json(setDifficulty(roomId, difficulty)); }catch(e){ res.status(400).json({ error: e.message }); } }
