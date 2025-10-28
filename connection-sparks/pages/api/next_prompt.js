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
          temperature: 0.95,
          max_tokens: 200
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

function generateRandomPrompt(usedPrompts) {
  const allPrompts = [
    "If your friend was a snack, what would they be? 🍿",
    "Describe each other in three words! 💬",
    "What's their hidden talent? ✨",
    "If they started a YouTube channel, what would it be about? 📹",
    "What emoji represents them best? 😊",
    "If you two were a band, what's your name? 🎸",
    "What's one thing that always makes them laugh? 😂",
    "Complete: My friend is the BEST at... 🏆",
    "If they were a season, which one? ☀️",
    "What's their spirit animal? 🦁",
    "If they had a catchphrase, what would it be? 💬",
    "What superpower do they secretly have? 🦸",
    "If your friendship was a TV show, what genre? 📺",
    "What's one word you'd never use to describe them? 🚫",
    "If they opened a store, what would it sell? 🛍️",
    "What's their vibe in one emoji? 😎",
    "If they wrote a book, what's the title? 📚",
    "What's their karaoke go-to? 🎤",
    "If they could teleport anywhere right now, where? 🌍",
    "What's one thing you appreciate about them? 💙"
  ]

  // Filter out already used prompts
  const available = allPrompts.filter(p => !usedPrompts.includes(p))
  if (available.length === 0) return allPrompts[Math.floor(Math.random() * allPrompts.length)]
  
  return available[Math.floor(Math.random() * available.length)]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session, round } = req.body

  if (!session || !round) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const usedPrompts = session.prompts_used || []
  let newPrompt

  // Mock mode
  if (!GROQ_API_KEY) {
    newPrompt = generateRandomPrompt(usedPrompts)

    return res.json({
      new_prompt: newPrompt
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    // Try to get AI-generated prompt
    try {
      const aiPrompt = await callGroqWithFallback([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Generate ONE short, fun Connection Sparks prompt for round ${round}/10. Make it playful, quick to answer, and different from these: ${usedPrompts.slice(0, 5).join(', ')}. Keep it under 15 words. Include one emoji. Don't number it.`
        }
      ])
      newPrompt = aiPrompt
    } catch (error) {
      // Fallback to random prompt if AI fails
      newPrompt = generateRandomPrompt(usedPrompts)
    }

    return res.json({
      new_prompt: newPrompt
    })
  } catch (error) {
    console.error('API Error:', error)
    newPrompt = generateRandomPrompt(usedPrompts)
    return res.json({ new_prompt: newPrompt })
  }
}
