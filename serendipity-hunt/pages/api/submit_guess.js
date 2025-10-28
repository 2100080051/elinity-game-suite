import fs from 'fs'
import path from 'path'
import axios from 'axios'

function getModelCandidates(){
  return process.env.GROQ_MODEL 
    ? [process.env.GROQ_MODEL, 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
    : ['groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
}

const categories = ['hobbies', 'habits', 'memories', 'quirks']
const categoryEmojis = {
  hobbies: ['🎨', '⚽', '🎮', '🎵', '📚', '🎬'],
  habits: ['☕', '🌙', '⏰', '🧘', '🚶', '✍️'],
  memories: ['🎂', '🌅', '🎓', '✈️', '📸', '🎪'],
  quirks: ['🤔', '😄', '🎭', '🌟', '💫', '🎲']
}

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'POST only'})
  
  const {players, vibe, clue, guess, treasures} = req.body
  if(!clue || !guess){
    return res.status(400).json({error:'clue and guess required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    const isCorrect = Math.random() > 0.5
    const category = categories[Math.floor(Math.random() * categories.length)]
    const emoji = categoryEmojis[category][Math.floor(Math.random() * categoryEmojis[category].length)]
    
    return res.json({
      correct: isCorrect,
      partial: !isCorrect && Math.random() > 0.5,
      category,
      gem_emoji: emoji,
      connection_title: isCorrect ? 'Shared Food Obsession' : null,
      connection_description: isCorrect ? 'Both of you are secretly passionate about culinary adventures!' : null,
      feedback: isCorrect ? 'Amazing detective work! You found the treasure!' : 'Close, but not quite. The real connection is even more surprising!'
    })
  }

  const models = getModelCandidates()
  let result = null

  const prompt = `Clue: "${clue}"
Player guess: "${guess}"

Evaluate if the guess correctly identifies the hidden connection. Return a JSON object:
{
  "correct": true/false (is guess correct or very close?),
  "partial": true/false (is guess somewhat related?),
  "category": "hobbies" | "habits" | "memories" | "quirks",
  "gem_emoji": "single emoji representing the connection",
  "connection_title": "short title for the connection (3-5 words)",
  "connection_description": "1-2 sentences explaining the real connection",
  "feedback": "encouraging message (playful for correct, supportive for incorrect)"
}

Be generous with "correct" - if they're close, mark it as correct.
If not correct but related, mark "partial" as true.

Return ONLY the JSON object, no extra text.`

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: prompt}
        ],
        temperature: 0.8,
        max_tokens: 400
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      })
      const text = apiRes.data.choices[0].message.content.trim()
      const match = text.match(/\{[\s\S]*\}/)
      if(match){
        result = JSON.parse(match[0])
        break
      }
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback
  if(!result){
    const category = categories[Math.floor(Math.random() * categories.length)]
    const emoji = categoryEmojis[category][Math.floor(Math.random() * categoryEmojis[category].length)]
    result = {
      correct: true,
      partial: false,
      category,
      gem_emoji: emoji,
      connection_title: 'Hidden Connection',
      connection_description: `You've discovered a surprising overlap - ${guess}!`,
      feedback: 'Great intuition! You found a treasure of connection!'
    }
  }

  return res.json(result)
}
