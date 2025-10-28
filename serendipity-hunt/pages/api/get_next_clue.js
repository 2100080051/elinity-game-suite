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
  
  const {players, vibe, treasures} = req.body
  if(!players || !Array.isArray(players)){
    return res.status(400).json({error:'players required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    const mockClues = [
      `There's a midnight habit both of you share, though you've never admitted it out loud...`,
      `One loves creating, the other loves collecting - but it's the same thing they're both drawn to...`,
      `Both of you have a secret spot where you go when you need to think. It's similar in a surprising way...`,
      `You share a quirky opinion about something most people take for granted...`,
      `There's a childhood memory that connects you across different times and places...`
    ]
    return res.json({clue: mockClues[Math.floor(Math.random() * mockClues.length)]})
  }

  const models = getModelCandidates()
  let clue = null

  const playerNames = players.join(', ')
  const vibeContext = vibe === 'deep' ? 'meaningful and profound' : vibe === 'team' ? 'professional and collaborative' : 'light and playful'
  const foundConnections = treasures && treasures.length > 0 
    ? treasures.map(t => t.title).join(', ')
    : 'none yet'
  
  const prompt = `Players: ${playerNames}
Vibe: ${vibeContext}
Already discovered: ${foundConnections}

Generate a NEW cryptic clue about a DIFFERENT hidden connection (don't repeat what's been found). The clue should:
- Be mysterious but solvable
- Hint at shared interests, habits, memories, or quirks
- Be 1-2 sentences
- Feel like a treasure hunt riddle

Return ONLY the clue text, nothing else.`

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: prompt}
        ],
        temperature: 0.95,
        max_tokens: 200
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      clue = apiRes.data.choices[0].message.content.trim()
      clue = clue.replace(/^["']|["']$/g, '')
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback
  if(!clue){
    const fallbackClues = [
      `Both of you have a relationship with time that's more similar than you'd think...`,
      `There's a shared feeling you both get in certain weather conditions...`,
      `You both have the same unusual way of organizing something in your life...`,
      `One collects moments, the other collects things - but the essence is identical...`
    ]
    clue = fallbackClues[Math.floor(Math.random() * fallbackClues.length)]
  }

  return res.json({clue})
}
