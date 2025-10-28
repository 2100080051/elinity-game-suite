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
          max_tokens: 300
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

  const { session, player_name, answer, current_prompt } = req.body

  if (!session || !player_name || !answer) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Randomly award spark (80% chance)
  const sparkEarned = Math.random() < 0.8

  // Mock mode
  if (!GROQ_API_KEY) {
    const mockReactions = [
      `😂 Love it! ${player_name} bringing the energy!`,
      `🔥 That's perfect! ${player_name} knows what's up!`,
      `⚡ Haha yes! ${player_name} nailed it!`,
      `💯 Amazing answer, ${player_name}!`,
      `😊 ${player_name} gets it! Keep going!`,
      `🎯 On point, ${player_name}! Next!`
    ]

    return res.json({
      ai_reaction: mockReactions[Math.floor(Math.random() * mockReactions.length)],
      spark_earned: sparkEarned
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Prompt was: "${current_prompt}". ${player_name} answered: "${answer}". React with a brief, witty, energetic response (1 sentence max, under 20 words). Use an emoji. Keep momentum high!`
      }
    ])

    return res.json({
      ai_reaction: aiResponse,
      spark_earned: sparkEarned
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to generate reaction', details: error.message })
  }
}
