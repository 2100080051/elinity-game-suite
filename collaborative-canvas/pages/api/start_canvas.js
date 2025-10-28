import axios from 'axios'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { players } = req.body
  if (!players || players.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 players' })
  }

  // Read system prompt
  const systemPromptPath = path.join(process.cwd(), 'public', 'system_prompt.txt')
  const systemPrompt = fs.existsSync(systemPromptPath)
    ? fs.readFileSync(systemPromptPath, 'utf-8')
    : 'You are ElinityAI, a creative art collaborator who narrates artwork evolution with poetic language.'

  // Create game session
  const session = {
    players,
    strokes: [],
    started_at: new Date().toISOString()
  }

  // Generate welcome message using Groq
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
              content: `Welcome ${players.length} artists: ${players.join(', ')}. Describe the blank canvas poetically (2-3 sentences). Encourage them to begin creating together.`
            }
          ],
          temperature: 0.8,
          max_tokens: 150
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const welcome_message = response.data.choices[0]?.message?.content || 'Welcome, artists. Our canvas awaits your vision.'
      const canvas_description = 'A pristine white canvas, full of possibility and light'

      return res.status(200).json({
        welcome_message,
        canvas_description,
        session
      })
    } catch (error) {
      console.error('Groq API error:', error.response?.data || error.message)
      // Fallback to mock
    }
  }

  // Mock mode fallback
  const welcomeMessages = [
    `Welcome, ${players.join(' and ')}. Before you lies a canvas, luminous and waiting. Each stroke you add will become part of something beautiful. Let's create together.`,
    `Artists ${players.join(', ')}, gather around. The canvas before you is alive with potential - a garden of light waiting to bloom. Your ideas will guide us.`,
    `Greetings, creators. This blank canvas holds infinite possibility. ${players[0]}, ${players[1]}${players.length > 2 ? `, ${players.slice(2).join(', ')}` : ''} - together, we will paint a story that has never been told.`
  ]

  const welcome_message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
  const canvas_description = 'A pristine white canvas, glowing softly with untold potential'

  return res.status(200).json({
    welcome_message,
    canvas_description,
    session
  })
}
