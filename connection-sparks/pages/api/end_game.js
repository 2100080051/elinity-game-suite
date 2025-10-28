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

  const { session, total_sparks, total_rounds } = req.body

  if (!session || total_sparks === undefined || !total_rounds) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const players = session.players
  const sparkRatio = total_sparks / total_rounds

  // Mock mode
  if (!GROQ_API_KEY) {
    let mockSummary
    if (sparkRatio >= 0.8) {
      mockSummary = `🔥 INCREDIBLE! ${players.join(' & ')} - you two are UNSTOPPABLE! ${total_sparks}/${total_rounds} sparks earned! Your energy is off the charts! The connections are REAL! ⚡💯`
    } else if (sparkRatio >= 0.6) {
      mockSummary = `⚡ Amazing job, ${players.join(' & ')}! You earned ${total_sparks}/${total_rounds} sparks! Great chemistry and quick thinking! You two really vibe! 😊🔥`
    } else {
      mockSummary = `💬 Fun round, ${players.join(' & ')}! You got ${total_sparks}/${total_rounds} sparks! Not bad for a first go! The connections are growing! Keep sparking! ⚡`
    }

    return res.json({ game_summary: mockSummary })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate a fun, energetic game summary for ${players.join(' and ')}. They earned ${total_sparks}/${total_rounds} sparks in Connection Sparks. ${sparkRatio >= 0.8 ? 'They did AMAZING!' : sparkRatio >= 0.6 ? 'They did great!' : 'They had fun!'} Keep it short (under 60 words), upbeat, and include emojis. Celebrate their connection!`
      }
    ])

    return res.json({ game_summary: aiResponse })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to generate summary', details: error.message })
  }
}
