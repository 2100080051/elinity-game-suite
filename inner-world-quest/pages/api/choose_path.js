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

function generateNextPaths(excludeEmotion) {
  const allPaths = [
    { name: 'The Garden of Memories', icon: '🌸', hint: 'Where past moments bloom like flowers', emotion: 'reflection' },
    { name: 'The Valley of Calm', icon: '🌊', hint: 'A peaceful descent into stillness', emotion: 'calm' },
    { name: 'The Mountains of Courage', icon: '⛰️', hint: 'Where strength is discovered in the climb', emotion: 'courage' },
    { name: 'The Meadow of Joy', icon: '🌻', hint: 'Sunlight dances on golden grass', emotion: 'joy' },
    { name: 'The Desert of Solitude', icon: '🏜️', hint: 'Where silence speaks volumes', emotion: 'peace' },
    { name: 'The Sky of Wonder', icon: '✨', hint: 'Infinite possibility above', emotion: 'wonder' },
    { name: 'The Forest of Growth', icon: '🌱', hint: 'Where new paths emerge from old roots', emotion: 'growth' },
    { name: 'The Bridge of Connection', icon: '🌉', hint: 'Linking heart to heart', emotion: 'love' },
    { name: 'The Lake of Reflection', icon: '💧', hint: 'Mirror of the soul', emotion: 'reflection' },
    { name: 'The Cave of Insight', icon: '🕯️', hint: 'Darkness reveals inner light', emotion: 'hope' }
  ]

  // Filter out the emotion just visited, shuffle, return 3
  const filtered = excludeEmotion 
    ? allPaths.filter(p => p.emotion !== excludeEmotion)
    : allPaths

  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session, path_choice } = req.body

  if (!session || !path_choice) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const visitedWorld = {
    name: path_choice.name,
    icon: path_choice.icon,
    emotion: path_choice.emotion
  }

  const updatedSession = {
    ...session,
    worlds_visited: [...(session.worlds_visited || []), visitedWorld],
    emotions_discovered: session.emotions_discovered.includes(path_choice.emotion)
      ? session.emotions_discovered
      : [...session.emotions_discovered, path_choice.emotion]
  }

  const nextPaths = generateNextPaths(path_choice.emotion)

  // Mock mode
  if (!GROQ_API_KEY) {
    const mockDescriptions = {
      'The Garden of Memories': 'You step into a garden where flowers bloom in shades of nostalgia. Each petal holds a memory - some sweet, some bittersweet. The air smells of rain and distant laughter. Time feels soft here, like a blanket woven from yesterday.',
      'The Valley of Calm': 'The world opens into a wide valley, quiet and cool. A gentle stream winds through silver grass, whispering secrets only the stillness can hear. Your breath slows. Your shoulders drop. Here, peace is not a destination - it simply is.',
      'The Mountains of Courage': 'Before you rise jagged peaks, their summits lost in cloud. The climb is steep, but with each step, you feel lighter. Fear transforms into fuel. At the top, the world stretches endlessly - you are stronger than you knew.',
      'The Meadow of Joy': 'Golden sunlight spills over a meadow alive with wildflowers. You feel warmth on your skin, laughter in your chest. Joy is not loud here - it is a quiet hum, a knowing smile, the feeling of being exactly where you belong.'
    }

    return res.json({
      landscape_description: mockDescriptions[path_choice.name] || `You enter ${path_choice.name}. The world shifts around you, taking shape from your emotions and imagination. What you see here is uniquely yours.`,
      emotion_tone: path_choice.emotion,
      visited_world: visitedWorld,
      session: updatedSession,
      next_paths: nextPaths
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `The player chose: "${path_choice.name}" (${path_choice.hint}). This realm represents the emotion: ${path_choice.emotion}.
        
        Generate a vivid, poetic description of this inner landscape. Use sensory details (sight, sound, touch, scent). Make it calm, beautiful, and emotionally resonant. Avoid anything negative or distressing. Keep it under 120 words. Invite the player to explore and reflect.`
      }
    ])

    return res.json({
      landscape_description: aiResponse,
      emotion_tone: path_choice.emotion,
      visited_world: visitedWorld,
      session: updatedSession,
      next_paths: nextPaths
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to generate landscape', details: error.message })
  }
}
