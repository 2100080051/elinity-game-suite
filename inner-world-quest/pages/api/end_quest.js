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
          max_tokens: 700
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

  const { session, total_worlds } = req.body

  if (!session || total_worlds === undefined) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const playerName = session.player_name
  const worldsVisited = session.worlds_visited || []
  const emotionsDiscovered = session.emotions_discovered || []

  // Mock mode
  if (!GROQ_API_KEY) {
    const worldNames = worldsVisited.map(w => w.name).join(', ')
    const emotionNames = emotionsDiscovered.join(', ')

    const mockJournal = `Dear ${playerName},

Your inner world journey has come to rest — for now. You traveled through ${total_worlds} landscapes: ${worldNames}.

Along the way, you discovered emotions that shaped your path: ${emotionNames}.

Each world you visited was a reflection of something within you — a truth, a memory, a feeling waiting to be acknowledged. The landscapes may fade, but what you learned stays with you.

The inner world is always there, waiting whenever you're ready to return. Until then, carry these moments with you like seeds — small, quiet, full of potential.

With warmth and light,
— ElinityAI ✨`

    return res.json({ travel_journal: mockJournal })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const worldList = worldsVisited.map(w => `${w.icon} ${w.name}`).join(', ')
    const emotionList = emotionsDiscovered.join(', ')

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate a reflective "Inner Travel Journal" summary for ${playerName}. They explored ${total_worlds} inner worlds: ${worldList}. They discovered these emotions: ${emotionList}.
        
        Write a warm, poetic closing that:
        - Honors their journey and self-exploration
        - Reflects on what these landscapes represent
        - Offers a gentle, hopeful closing thought
        - Feels personal and emotionally intelligent
        
        Keep it under 180 words. Sign as "ElinityAI ✨". Make it beautiful.`
      }
    ])

    return res.json({ travel_journal: aiResponse })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to generate journal', details: error.message })
  }
}
