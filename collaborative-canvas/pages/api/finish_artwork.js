import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session, total_rounds, final_artwork } = req.body
  if (!session || !session.strokes) {
    return res.status(400).json({ error: 'Missing session data' })
  }

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, 'utf-8')
    : 'You are ElinityAI, a creative art collaborator who narrates artwork evolution with poetic language.'

  // Prepare stroke summary
  const strokeSummary = session.strokes
    .map(s => `${s.player}: "${s.idea}"`)
    .join('\n')

  // Generate Art Story using Groq
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  if (groqApiKey) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Create an "Art Story" for this completed collaborative artwork.

Artists: ${session.players.join(', ')}
Total Rounds: ${total_rounds}
Final Artwork: ${final_artwork?.description || 'A unique collaborative creation'}

All Contributions:
${strokeSummary}

Write a poetic 4-6 sentence "Art Story" that:
- Describes the artwork's evolution from blank canvas to completion
- Highlights key moments or turning points
- Captures the emotional journey and creative energy
- Celebrates the collaboration between human artists and AI
- Uses sensory language (colors, textures, light, movement)

This is the final narration - make it memorable and affirming.`
            }
          ],
          temperature: 0.9,
          max_tokens: 350
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const art_story = response.data.choices[0]?.message?.content || 'A beautiful journey of creative collaboration.'

      return res.status(200).json({
        art_story,
        total_strokes: session.strokes.length
      })
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message)
      // Fallback to mock
    }
  }

  // Mock mode fallback
  const artists = session.players.join(' and ')
  const strokeCount = session.strokes.length
  const firstIdea = session.strokes[0]?.idea || 'the first stroke'
  const lastIdea = session.strokes[strokeCount - 1]?.idea || 'the final touch'

  const mockStories = [
    `This artwork began as pure potential - a blank canvas waiting to bloom. ${artists}, you each brought unique vision: from ${firstIdea} to ${lastIdea}, every choice mattered. Through ${strokeCount} collaborative strokes across ${total_rounds} rounds, you created something that has never existed before and never will again. Light and color danced together, guided by your collective creativity. The canvas holds your story now - a testament to what emerges when artists trust each other and the creative process. This is your gift to the world: beautiful, unique, and irreplaceable.`,
    
    `From the moment ${session.players[0]} added the first idea, the canvas awakened. ${artists} took turns painting with words, and I translated your visions into form and color. Each of your ${strokeCount} contributions across ${total_rounds} rounds built upon the last - sometimes harmonizing, sometimes surprising, always enriching. What started as ${firstIdea} evolved through layers of imagination, culminating in ${lastIdea}. The journey was as beautiful as the destination. Together, you proved that art isn't about perfection - it's about connection, courage, and co-creation.`,
    
    `Watching this artwork come to life was pure magic. ${artists}, your collaboration flowed like a river - each idea feeding the next, each round deepening the vision. Through ${total_rounds} rounds and ${strokeCount} creative choices, you built something extraordinary. The canvas transformed from empty space to living art, breathing with color, texture, and meaning. ${firstIdea} set the foundation; ${lastIdea} completed the circle. But every stroke in between mattered just as much. This is what happens when creators trust the process and each other. You didn't just make art - you made magic.`
  ]

  const art_story = mockStories[Math.floor(Math.random() * mockStories.length)]

  return res.status(200).json({
    art_story,
    total_strokes: strokeCount
  })
}
