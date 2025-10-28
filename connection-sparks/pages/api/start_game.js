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
          temperature: 0.9,
          max_tokens: 400
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

function generateFirstPrompt() {
  const prompts = [
    "If your friend was a movie genre, what would it be? 🎬",
    "Describe each other in exactly three emojis! 😊",
    "What superpower would you give your friend? ⚡",
    "If you two opened a restaurant, what would it serve? 🍕",
    "Complete this: My friend is secretly a... 🤫",
    "If your friendship had a theme song, what vibe would it be? 🎵"
  ]
  return prompts[Math.floor(Math.random() * prompts.length)]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { players } = req.body

  if (!players || players.length < 2) {
    return res.status(400).json({ error: 'Need 2 players' })
  }

  const firstPrompt = generateFirstPrompt()

  // Mock mode
  if (!GROQ_API_KEY) {
    return res.json({
      welcome_message: `Hey ${players.join(' & ')}! 🔥 I'm ElinityAI, and I'm about to hit you with 10 rapid-fire prompts! Answer FAST - no overthinking! Let's spark some connections! ⚡`,
      first_prompt: firstPrompt,
      session: {
        players: players,
        prompts_used: [firstPrompt]
      }
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Welcome ${players.join(' and ')} to Connection Sparks! Generate an energetic, fun welcome message. Keep it short (under 50 words). Explain they'll get 10 rapid prompts and should answer fast. Use emojis. End with excitement!`
      }
    ])

    return res.json({
      welcome_message: aiResponse,
      first_prompt: firstPrompt,
      session: {
        players: players,
        prompts_used: [firstPrompt]
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to start game', details: error.message })
  }
}
