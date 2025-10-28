import { getState } from '../../lib/store';
export default function handler(req,res){ const { sessionId } = req.query||{}; try{ res.status(200).json(getState(sessionId)); }catch(e){ res.status(400).json({error:e.message}); } }
