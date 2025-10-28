import { newSession, setTheme, summonBeast } from '../../lib/store';
export default async function handler(req,res){ if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const { sessionId } = newSession();
    await setTheme(sessionId);
    const s = await summonBeast(sessionId);
    res.status(200).json({ sessionId, state: s });
  }catch(e){ res.status(400).json({ error: e.message }); }
}
