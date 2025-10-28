import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session, player_name, stroke_idea, current_artwork, round } = req.body
  if (!session || !player_name || !stroke_idea) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Determine artistic stage
  let stage = 'Beginning'
  if (round >= 7) stage = 'Completing'
  else if (round >= 5) stage = 'Harmonizing'
  else if (round >= 3) stage = 'Developing'

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, 'utf-8')
    : 'You are ElinityAI, a creative art collaborator who narrates artwork evolution with poetic language.'

  // Add stroke to session
  const new_stroke = {
    player: player_name,
    idea: stroke_idea,
    round,
    timestamp: new Date().toISOString()
  }
  session.strokes.push(new_stroke)

  // Generate art narration using Groq
  const groqApiKey = process.env.GROQ_API_KEY
  const groqModel = process.env.GROQ_MODEL || 'groq/compound'

  if (groqApiKey) {
    try {
      const artworkContext = current_artwork?.description || 'a blank canvas'
      const previousStrokes = session.strokes.slice(-3).map(s => `${s.player}: "${s.idea}"`).join('; ')

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Current artwork: ${artworkContext}

${player_name} adds: "${stroke_idea}"

Stage: ${stage} (Round ${round})
Recent strokes: ${previousStrokes || 'First stroke'}

Narrate how this new element appears on the canvas (3-4 sentences). Use sensory language (colors bloom, light flows, textures emerge). Be encouraging and poetic. Describe what viewers would now see.`
            }
          ],
          temperature: 0.85,
          max_tokens: 200
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const art_narration = response.data.choices[0]?.message?.content || `${player_name}'s vision blends beautifully into the canvas.`
      
      // Update artwork description
      const updated_artwork = {
        description: `${current_artwork?.description || 'The canvas'} now shows ${stroke_idea.toLowerCase()}`,
        visual: 'evolving',
        strokes: session.strokes.length
      }

      return res.status(200).json({
        art_narration,
        updated_artwork,
        session
      })
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message)
      // Fallback to mock
    }
  }

  // Mock mode fallback
  const mockNarrations = [
    `Beautiful choice, ${player_name}. The ${stroke_idea.toLowerCase()} emerges on the canvas like a whisper becoming visible - soft at first, then blooming with confidence. The composition breathes with new life.`,
    `${player_name}'s vision flows onto the canvas. The ${stroke_idea.toLowerCase()} appears, its presence transforming the space around it. Light catches the edges, and the artwork pulses with growing energy.`,
    `Watch as ${player_name}'s idea takes form: ${stroke_idea.toLowerCase()} unfolds across the surface, rich with color and intention. The piece is truly coming alive, each element harmonizing with what came before.`,
    `The ${stroke_idea.toLowerCase()} blooms into being, guided by ${player_name}'s creative spirit. Textures deepen, hues shift and dance. Our canvas holds this gift with grace, weaving it into the larger story.`,
    `This adds such depth, ${player_name}. The ${stroke_idea.toLowerCase()} settles into place as though it was always meant to be there. The artwork glows with the accumulated energy of every contributor.`
  ]

  const art_narration = mockNarrations[Math.floor(Math.random() * mockNarrations.length)]
  
  const updated_artwork = {
    description: `A collaborative artwork featuring ${session.strokes.map(s => s.idea.toLowerCase()).slice(-5).join(', ')}`,
    visual: 'evolving',
    strokes: session.strokes.length
  }

  return res.status(200).json({
    art_narration,
    updated_artwork,
    session
  })
}
