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
          max_tokens: 600
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

function generateInitialPaths() {
  const allPaths = [
    { name: 'The Garden of Memories', icon: '🌸', hint: 'Where past moments bloom like flowers', emotion: 'reflection' },
    { name: 'The Valley of Calm', icon: '🌊', hint: 'A peaceful descent into stillness', emotion: 'calm' },
    { name: 'The Mountains of Courage', icon: '⛰️', hint: 'Where strength is discovered in the climb', emotion: 'courage' },
    { name: 'The Meadow of Joy', icon: '🌻', hint: 'Sunlight dances on golden grass', emotion: 'joy' },
    { name: 'The River of Time', icon: '⏳', hint: 'Flowing forward, always changing', emotion: 'reflection' },
    { name: 'The Sky of Wonder', icon: '✨', hint: 'Infinite possibility above', emotion: 'wonder' },
    { name: 'The Forest of Growth', icon: '🌱', hint: 'Where new paths emerge from old roots', emotion: 'growth' },
    { name: 'The Bridge of Connection', icon: '🌉', hint: 'Linking heart to heart', emotion: 'love' }
  ]

  // Return 3 random paths
  const shuffled = allPaths.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { player_name } = req.body

  if (!player_name) {
    return res.status(400).json({ error: 'Player name required' })
  }

  const initialPaths = generateInitialPaths()

  // Mock mode
  if (!GROQ_API_KEY) {
    return res.json({
      welcome_message: `Welcome, ${player_name}. 🌌\n\nYou stand at the threshold of your inner world — a place where emotions take form as landscapes, and memories bloom like gardens.\n\nBefore you, three paths shimmer in the mist. Each leads to a different realm of feeling and imagination. There is no right choice — only the one that calls to you.\n\nTake your time. When you're ready, choose your first path.`,
      initial_paths: initialPaths,
      session: {
        player_name: player_name,
        worlds_visited: [],
        emotions_discovered: []
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
        content: `Welcome ${player_name} to Inner World Quest. Generate a warm, poetic welcome message explaining that they're about to explore inner emotional landscapes. Introduce yourself as ElinityAI, their empathetic guide. Keep it calm, beautiful, and under 100 words. End by inviting them to choose their first path.`
      }
    ])

    return res.json({
      welcome_message: aiResponse,
      initial_paths: initialPaths,
      session: {
        player_name: player_name,
        worlds_visited: [],
        emotions_discovered: []
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to start quest', details: error.message })
  }
}
