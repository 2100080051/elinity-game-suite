import fs from 'fs'
import path from 'path'
import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'groq/compound'

function getSystemPrompt() {
  const promptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  return fs.readFileSync(promptPath, 'utf-8')
}

function getModelCandidates() {
  return [
    GROQ_MODEL,
    'groq/compound',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ]
}

async function callGroqWithFallback(messages) {
  const models = getModelCandidates()

  for (const model of models) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: model,
          messages: messages,
          temperature: 0.8,
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )
      return response.data.choices[0].message.content
    } catch (error) {
      console.error(`Model ${model} failed:`, error.response?.data || error.message)
      if (model === models[models.length - 1]) throw error
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session, total_jumps } = req.body

  if (!session || !total_jumps) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const players = session.players
  const jumps = session.jumps || []

  // Mock mode
  if (!GROQ_API_KEY) {
    const mockSummary = `🕰️ **TRAVEL LOG COMPLETE** 🕰️

Time Travelers: ${players.join(', ')}

**Journey Summary:**
You've jumped through ${total_jumps} incredible eras! From ${jumps[0]?.name || 'the beginning'} to ${jumps[jumps.length - 1]?.name || 'the end'}, you've experienced history like never before.

**Highlights:**
✨ You survived dinosaurs, danced in the 1920s, and rode flying cars in the future
✨ You caused at least one timeline glitch (probably more)
✨ You proved that no matter the era, humans are wonderfully weird

**Final Thought:**
Time is a circle, a line, and a wibbly-wobbly ball of possibilities. Thanks for traveling with me!

— ElinityAI, Your Time Conductor 🎩⏳`

    return res.json({ travel_log: mockSummary })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const eraList = jumps.map(j => `${j.year} (${j.name})`).join(', ')

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate a final "Travel Log" summary for ${players.join(', ')}. They traveled through ${total_jumps} eras: ${eraList}.
        
        Write a humorous and thoughtful recap of their journey. Include:
        - A warm closing from you (ElinityAI, the Time Conductor)
        - Highlights or funny moments from their adventure
        - A memorable closing thought about time travel
        
        Keep it under 200 words. Make it heartfelt and fun!`
      }
    ])

    return res.json({ travel_log: aiResponse })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to generate travel log', details: error.message })
  }
}
