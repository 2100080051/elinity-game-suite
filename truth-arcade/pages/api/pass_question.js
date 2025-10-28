import fs from 'fs'
import path from 'path'
import axios from 'axios'

function getModelCandidates(){
  return process.env.GROQ_MODEL 
    ? [process.env.GROQ_MODEL, 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    : ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
}

function getQuestionLevel(round){
  if(round <= 2) return 'light'
  if(round <= 5) return 'medium'
  return 'deep'
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const {game_state} = req.body
  if(!game_state){
    return res.status(400).json({error:'game_state required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  // Deduct token
  game_state.players[game_state.current_player_index].tokens -= 1

  // Move to next player
  game_state.current_player_index = (game_state.current_player_index + 1) % game_state.players.length
  
  // Increment round if we've cycled through all players
  if(game_state.current_player_index === 0){
    game_state.round += 1
  }

  const apiKey = process.env.GROQ_API_KEY
  const currentPlayer = game_state.players[game_state.current_player_index].name
  const level = getQuestionLevel(game_state.round)

  if(!apiKey){
    // Mock mode
    return res.json({
      game_state,
      comment: "That's okay! You lost a token, but we respect your boundaries! 💭",
      next_question: game_state.round > 10 ? null : `${currentPlayer}, your turn!`,
      game_over: game_state.round > 10
    })
  }

  const models = getModelCandidates()
  let comment = ''
  let nextQuestion = ''

  // Get AI comment on pass
  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: `Player passed on a question. Give a brief, supportive comment (1-2 sentences). Mention they lost a token but it's okay.`}
        ],
        temperature: 0.85,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      comment = apiRes.data.choices[0].message.content.trim()
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Get next question if game continues
  if(game_state.round <= 10){
    const levelPrompts = {
      light: 'Generate a LIGHT and FUN question',
      medium: 'Generate an INTERESTING and PERSONAL question (not too invasive)',
      deep: 'Generate a DEEP and THOUGHT-PROVOKING question'
    }

    for(const model of models){
      try{
        const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model,
          messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: `${levelPrompts[level]} for ${currentPlayer}. Round ${game_state.round}. Address them by name. Return ONLY the question.`}
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
        nextQuestion = apiRes.data.choices[0].message.content.trim()
        break
      }catch(err){
        console.error(`Model ${model} failed:`, err.response?.data || err.message)
      }
    }
  }

  // Fallbacks
  if(!comment) comment = "No worries! You lost a token, but sometimes passing is the right call. 💭"
  if(!nextQuestion && game_state.round <= 10) nextQuestion = `${currentPlayer}, here's your question!`

  return res.json({
    game_state,
    comment,
    next_question: game_state.round > 10 ? null : nextQuestion,
    game_over: game_state.round > 10
  })
}
