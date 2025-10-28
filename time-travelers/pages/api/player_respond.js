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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session, player_name, response: playerResponse, current_era } = req.body

  if (!session || !player_name || !playerResponse || !current_era) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Determine if this should be a glitch (15% chance)
  const isGlitch = Math.random() < 0.15

  // Mock mode
  if (!GROQ_API_KEY) {
    const mockReactions = [
      `Brilliant move, ${player_name}! Your quick thinking just altered the timeline.`,
      `${player_name}, that's... unexpected. The locals are staring at you with confusion.`,
      `Oh, ${player_name}! The time stream ripples with your bold decision.`,
      `Fascinating choice, ${player_name}. History books may never be the same.`
    ]

    const glitchReactions = [
      `⚠️ TIMELINE GLITCH! ${player_name}'s action just caused a temporal paradox! You suddenly see your future self waving at you from across the street!`,
      `⚠️ TEMPORAL ANOMALY! Time stutters around ${player_name}. For a moment, everything repeats — you're living the same 5 seconds twice!`,
      `⚠️ DIMENSION SHIFT! ${player_name} accidentally opened a portal! A confused medieval knight stumbles through into ${current_era.year}!`
    ]

    return res.json({
      ai_reaction: isGlitch
        ? glitchReactions[Math.floor(Math.random() * glitchReactions.length)]
        : mockReactions[Math.floor(Math.random() * mockReactions.length)],
      is_glitch: isGlitch
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const prompt = isGlitch
      ? `We're in ${current_era.year} (${current_era.name}). ${player_name} just said: "${playerResponse}". 
      
      Generate a TIMELINE GLITCH — a sudden unexpected event that disrupts the scene (like meeting their future self, a dinosaur appearing, time stuttering, etc.). Make it funny and wild. Keep under 100 words. Start with "⚠️ TIMELINE GLITCH!"`
      : `We're in ${current_era.year} (${current_era.name}). ${player_name} just said: "${playerResponse}". 
      
      React to their response with humor and creativity. Describe what happens next in this era based on their action. Keep it cinematic and playful. Under 100 words.`

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ])

    return res.json({
      ai_reaction: aiResponse,
      is_glitch: isGlitch
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to generate response', details: error.message })
  }
}
