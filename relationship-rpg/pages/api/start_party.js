import fs from 'fs'
import path from 'path'
import axios from 'axios'

function getModelCandidates(){
  return process.env.GROQ_MODEL 
    ? [process.env.GROQ_MODEL, 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    : ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const {party_name, players} = req.body
  if(!party_name || !Array.isArray(players) || players.length < 2){
    return res.status(400).json({error:'party_name and at least 2 players required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const initialState = {
    party_name,
    players,
    quests: [],
    xp_total: 0,
    level: 1,
    artifacts: [],
    history: [
      {timestamp: new Date().toISOString(), event: 'party_created'}
    ]
  }

  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    return res.json(initialState)
  }

  const models = getModelCandidates()
  let greeting = `Welcome, ${party_name}! Your journey begins.`

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: `Party "${party_name}" with players ${players.map(p => p.name).join(', ')} just started. Give them a warm welcome in 2-3 sentences.`}
        ],
        temperature: 0.8,
        max_tokens: 200
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      greeting = apiRes.data.choices[0].message.content.trim()
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  return res.json({...initialState, greeting})
}
