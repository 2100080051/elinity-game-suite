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
  
  const {players, vibe} = req.body
  if(!players || !Array.isArray(players) || players.length < 2){
    return res.status(400).json({error:'At least 2 players required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    const mockClues = [
      `One of you hums while cooking, the other can't stop listening to food podcasts...`,
      `Both of you have a secret midnight snack ritual, though you've never mentioned it...`,
      `You both share a peculiar habit involving coffee and morning routines...`,
      `There's a memory of childhood summers that connects you in unexpected ways...`
    ]
    return res.json({clue: mockClues[Math.floor(Math.random() * mockClues.length)]})
  }

  const models = getModelCandidates()
  let clue = null

  const playerNames = players.join(', ')
  const vibeContext = vibe === 'deep' ? 'meaningful and profound' : vibe === 'team' ? 'professional and collaborative' : 'light and playful'
  
  const prompt = `Players: ${playerNames}
Vibe: ${vibeContext}

Generate ONE cryptic clue that hints at a possible hidden connection between these players. The clue should be:
- Mysterious but solvable
- About shared interests, habits, memories, or quirks
- 1-2 sentences
- Encouraging players to guess

Examples:
"One of you hums while cooking, the other can't stop listening to kitchen podcasts..."
"Both of you share a secret love for something most people find boring..."
"There's a quirky habit you both have that involves the number 3..."

Return ONLY the clue text, nothing else.`

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: prompt}
        ],
        temperature: 0.9,
        max_tokens: 200
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      clue = apiRes.data.choices[0].message.content.trim()
      // Remove quotes if present
      clue = clue.replace(/^["']|["']$/g, '')
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback
  if(!clue){
    clue = `Both of you share something surprising that you've probably never discussed... it's closer than you think.`
  }

  return res.json({clue})
}
