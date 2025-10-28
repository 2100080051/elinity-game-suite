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
  
  const {players} = req.body
  if(!players || !Array.isArray(players) || players.length < 2 || players.length > 4){
    return res.status(400).json({error:'2-4 players required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  // Initialize game state
  const gameState = {
    players: players.map(name => ({name, tokens: 3})),
    round: 1,
    current_player_index: 0
  }

  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    return res.json({
      game_state: gameState,
      welcome: "Welcome to Truth Arcade! 🎯 Get ready for honest conversations and fun questions!",
      first_question: `${players[0]}, here's your first question: What's the weirdest food combination you secretly love?`
    })
  }

  const models = getModelCandidates()
  let welcome = ''
  let firstQuestion = ''

  const playerNames = players.join(', ')
  
  // Get welcome message
  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: `Welcome ${playerNames} to Truth Arcade. Give them a warm, brief welcome (2-3 sentences) and explain the game.`}
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
      welcome = apiRes.data.choices[0].message.content.trim()
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Get first question
  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: `Generate a LIGHT and FUN question for ${players[0]}. This is round 1, so keep it silly and easy. Return ONLY the question, address them by name.`}
        ],
        temperature: 0.9,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      firstQuestion = apiRes.data.choices[0].message.content.trim()
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallbacks
  if(!welcome) welcome = "Welcome to Truth Arcade! 🎯 Answer questions to earn tokens, pass to lose one. Let's see who's the most honest!"
  if(!firstQuestion) firstQuestion = `${players[0]}, what's the most embarrassing song on your playlist?`

  return res.json({
    game_state: gameState,
    welcome,
    first_question: firstQuestion
  })
}
