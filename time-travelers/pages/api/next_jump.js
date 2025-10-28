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

function generateRandomEra(previousEra) {
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

  // Avoid repeating the previous era
  let newEra
  do {
    newEra = eras[Math.floor(Math.random() * eras.length)]
  } while (previousEra && newEra.year === previousEra.year)

  return newEra
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session, jump_count, previous_era } = req.body

  if (!session || jump_count === undefined) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const newEra = generateRandomEra(previous_era)
  const updatedSession = {
    ...session,
    jumps: [...(session.jumps || []), newEra]
  }

  // Mock mode
  if (!GROQ_API_KEY) {
    return res.json({
      new_era: newEra,
      transition_message: `⏩ TIME JUMP ACTIVATED!\n\nThe world blurs and spins... You're hurtling through time!\n\n✨ You've arrived in ${newEra.year} — ${newEra.name}!\n\n${newEra.description}\n\nWhat do you do?`,
      session: updatedSession
    })
  }

  // Real AI mode
  try {
    const systemPrompt = getSystemPrompt()

    const aiResponse = await callGroqWithFallback([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Generate a dramatic time jump transition. The travelers are leaving ${previous_era?.year || 'the previous era'} and arriving in ${newEra.year} (${newEra.name}). 
        
        Describe the sensation of time travel (spinning, colors, sounds) and then vividly describe the new era: ${newEra.description}
        
        End with a fun challenge or question for the players. Keep under 120 words. Make it cinematic!`
      }
    ])

    return res.json({
      new_era: newEra,
      transition_message: aiResponse,
      session: updatedSession
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Failed to jump through time', details: error.message })
  }
}
