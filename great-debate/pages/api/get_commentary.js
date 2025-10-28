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
  
  const {topic, arguments: debateArgs} = req.body
  if(!topic || !debateArgs || !Array.isArray(debateArgs)){
    return res.status(400).json({error:'topic and arguments required'})
  }

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), 'public', 'system_prompt.txt'), 'utf8')
  
  const apiKey = process.env.GROQ_API_KEY
  if(!apiKey){
    // Mock mode
    const mockComments = [
      "Oh, this is getting spicy! Both sides bringing the heat! 🔥",
      "Interesting points! Though I'm not sure logic is winning here... 😂",
      "The sass levels are off the charts! Keep it coming!",
      "Wait, are we still talking about the same topic? LOL",
      "Bold strategy! Let's see how this plays out..."
    ]
    return res.json({commentary: mockComments[Math.floor(Math.random() * mockComments.length)]})
  }

  const models = getModelCandidates()
  let commentary = ''

  const recentArgs = debateArgs.slice(-2).map(arg => `${arg.player} (${arg.side}): ${arg.text}`).join('\n')
  const prompt = `Topic: ${topic}\n\nRecent arguments:\n${recentArgs}\n\nProvide witty, playful commentary on these arguments (1-2 sentences). Keep it light and fun!`

  for(const model of models){
    try{
      const apiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          {role: 'system', content: systemPrompt},
          {role: 'user', content: prompt}
        ],
        temperature: 0.9,
        max_tokens: 150
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })
      commentary = apiRes.data.choices[0].message.content.trim()
      break
    }catch(err){
      console.error(`Model ${model} failed:`, err.response?.data || err.message)
    }
  }

  // Fallback
  if(!commentary){
    commentary = "The plot thickens! Both sides making compelling points... or are they? 🤔"
  }

  return res.json({commentary})
}
