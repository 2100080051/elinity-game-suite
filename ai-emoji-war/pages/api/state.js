import { getState } from '../../lib/store';
export default function handler(req,res){ const { roomId } = req.query; try{ res.status(200).json(getState(roomId)); }catch(e){ res.status(400).json({ error: e.message }); } }
