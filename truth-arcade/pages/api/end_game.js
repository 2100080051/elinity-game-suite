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
  
  const {game_state} = req.body
  if(!game_state){
    return res.status(400).json({error:'game_state required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  const sortedPlayers = [...game_state.players].sort((a, b) => b.tokens - a.tokens)
  const winner = sortedPlayers[0]

  if(!apiKey){
    // Mock mode
    return res.json({
      summary: `🎯 Game Over! ${winner.name} wins with ${winner.tokens} tokens! Thanks for playing Truth Arcade - you all showed great honesty today! 😊`
    })
  }

  const models = getModelCandidates()
  let summary = ''

  const playerScores = game_state.players.map(p => `${p.name}: ${p.tokens} tokens`).join(', ')
  
  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: `Game ended. Scores: ${playerScores}\n\nGive a lighthearted summary (3-4 sentences). Congratulate the winner, acknowledge everyone's honesty, and thank them for playing.`}
        ],
        temperature: 0.85,
        max_tokens: 250
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      summary = apiRes.data.choices[0].message.content.trim()
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback
  if(!summary){
    summary = `🎯 Game Over! Congratulations to ${winner.name} for being the most honest with ${winner.tokens} tokens! Everyone showed great courage in sharing today. Thanks for playing Truth Arcade! 😊`
  }

  return res.json({summary})
}
