import { getState } from '../../lib/store';
export default function handler(req,res){
	const { sessionId } = req.query||{};
	try{
		res.status(200).json(getState(sessionId));
	}catch(e){
		// If no session yet (first load or serverless cold start), return a default empty state instead of 400
		if((e?.message||'').toLowerCase().includes('no session')){
			return res.status(200).json({ id: String(sessionId||''), setup: null, title: '', index: 0, dialogues: [], panels: [], current: null, finished: false });
		}
		res.status(400).json({error:e.message});
	}
}
