import { generateRoastPrompt } from '../../lib/openrouter';

export default async function handler(req,res){
  const name = req.query.name || 'Alex';
  try{
    const prompt = await generateRoastPrompt(String(name));
    res.status(200).json({ prompt });
  }catch(e){
    res.status(200).json({ prompt: `Roast ${name}'s cheerful chaos.` });
  }
}
