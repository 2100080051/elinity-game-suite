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
          temperature: 0.85,
          max_tokens: 500
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

  const { session, reflection } = req.body

  if (!session || !reflection) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const currentWorld = session.worlds_visited[session.worlds_visited.length - 1]

  // Mock mode
  if (!GROQ_API_KEY) {
    const mockResponses = [
      `As you speak, the landscape around you shifts gently — your words become light, painting the air with soft color. The world listens.`,
      `Your reflection echoes through this place. The ground beneath you hums with recognition. You belong here.`,
      `The atmosphere brightens as you share. Even in this inner world, connection is everything. What else do you notice?`,
      `A gentle wind carries your words across the landscape. They settle like seeds — something new may grow here.`
    ]

    return res.json({
      ai_response: mockResponses[Math.floor(Math.random() * mockResponses.length)]
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `We're in "${currentWorld?.name || 'an inner landscape'}" — a realm of ${currentWorld?.emotion || 'emotion'}.
        
        The player just reflected: "${reflection}"
        
        Respond to their reflection with empathy and poetry. Weave their words back into the landscape — show how their thoughts affect the world around them. Keep it gentle, affirming, and under 80 words. Encourage continued exploration.`
      }
    ])

    return res.json({
      ai_response: aiResponse
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to generate response', details: error.message })
  }
}
