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

function generateRandomEra() {
  const eras = [
    { year: '65 Million BC', name: 'Age of Dinosaurs', description: 'Massive ferns tower overhead. You hear a distant roar — and feel the ground tremble beneath your feet.' },
    { year: '10,000 BC', name: 'Ice Age', description: 'Frozen tundra stretches endlessly. Woolly mammoths graze in the distance, and your breath fogs in the frigid air.' },
    { year: '2500 BC', name: 'Ancient Egypt', description: 'The pyramids gleam under the scorching sun. Workers haul massive stone blocks while priests chant mysterious hymns.' },
    { year: '1200 AD', name: 'Medieval Europe', description: 'Castle towers loom over cobblestone streets. Knights clank past in armor, and the smell of roasted meat fills the air.' },
    { year: '1500 AD', name: 'Renaissance Italy', description: 'Artists paint masterpieces in bustling piazzas. The scent of fresh bread and ink mingles in the vibrant city.' },
    { year: '1850 AD', name: 'Industrial Revolution', description: 'Steam engines hiss and clank. Factory smokestacks darken the sky, and gears turn in massive iron machines.' },
    { year: '1925 AD', name: 'Roaring Twenties', description: 'Jazz music spills from speakeasies. Flappers dance under glittering chandeliers, and Model T cars rumble down the streets.' },
    { year: '1969 AD', name: 'Space Age', description: 'Rockets launch into the cosmos. TVs broadcast moon landings, and futuristic optimism fills the air.' },
    { year: '2077 AD', name: 'Cyberpunk Metropolis', description: 'Neon signs flicker in the rain. Flying cars zip between skyscrapers, and holographic ads light up every corner.' },
    { year: '2150 AD', name: 'Post-Climate Earth', description: 'Floating cities hover above flooded lands. Solar panels glisten, and everyone travels via magnetic levitation trains.' },
    { year: '3025 AD', name: 'Galactic Federation', description: 'Spaceports bustle with alien traders. Translucent energy barriers shimmer, and starships dock at orbital platforms.' },
    { year: '5500 AD', name: 'Far Future Earth', description: 'Humans have evolved. Telepathy is common, and cities are built from living crystal that hums with energy.' },
    { year: 'Alternate 1985', name: 'Steampunk Timeline', description: 'Airships float overhead. Clockwork robots serve tea, and everyone wears brass goggles and leather coats.' },
    { year: 'Alternate 2024', name: 'Dinosaur World', description: 'What if dinosaurs never went extinct? Triceratops pull carriages, and pterodactyls deliver mail from the sky.' }
  ]

  return eras[Math.floor(Math.random() * eras.length)]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { players } = req.body

  if (!players || players.length < 2) {
    return res.status(400).json({ error: 'At least 2 players required' })
  }

  // Mock mode (no API key)
  if (!GROQ_API_KEY) {
    const firstEra = generateRandomEra()
    return res.json({
      welcome_message: `🕰️ Welcome, time travelers! I'm ElinityAI, your Time Conductor. Buckle up — we're about to journey through the ages!\n\nFirst stop: ${firstEra.year}`,
      first_era: firstEra,
      session: {
        players: players,
        jumps: [firstEra]
      }
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()
    const firstEra = generateRandomEra()

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Welcome ${players.join(', ')} to Time Travelers! Generate a cinematic welcome message introducing yourself as the Time Conductor. Then announce the first era: ${firstEra.year} (${firstEra.name}). Describe the scene vividly and give players a fun opening challenge or question relevant to this time period. Keep it under 150 words.`
      }
    ])

    return res.json({
      welcome_message: aiResponse,
      first_era: firstEra,
      session: {
        players: players,
        jumps: [firstEra]
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to start journey', details: error.message })
  }
}
